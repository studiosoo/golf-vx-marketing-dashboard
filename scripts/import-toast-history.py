"""
Toast SFTP Historical Import Script
Imports all 211 date folders from Toast SFTP into toast_daily_summary and toast_payments tables.
"""
import os
import re
import io
import logging
import paramiko
import pandas as pd
import mysql.connector
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')

# === SFTP CONFIG ===
SFTP_HOST = 's-9b0f88558b264dfda.server.transfer.us-east-1.amazonaws.com'
SFTP_PORT = 22
SFTP_USERNAME = 'GolfVXExportUser'
SFTP_KEY_PATH = os.path.expanduser('~/.ssh/toast_sftp_key')
SFTP_KEY_PASSPHRASE = 'Fairways&Greens'
SFTP_SITE_FOLDER = '264423'

# === DB CONFIG ===
DATABASE_URL = os.environ.get('DATABASE_URL', '')

def parse_db_url(url):
    """Parse mysql://user:pass@host:port/db"""
    p = urlparse(url)
    return {
        'host': p.hostname,
        'port': p.port or 3306,
        'user': p.username,
        'password': p.password,
        'database': p.path.lstrip('/'),
        'ssl_disabled': False,
    }

def get_db():
    cfg = parse_db_url(DATABASE_URL)
    return mysql.connector.connect(**cfg)

def sftp_connect():
    key = paramiko.RSAKey.from_private_key_file(SFTP_KEY_PATH, password=SFTP_KEY_PASSPHRASE)
    transport = paramiko.Transport((SFTP_HOST, SFTP_PORT))
    transport.connect(username=SFTP_USERNAME, pkey=key)
    sftp = paramiko.SFTPClient.from_transport(transport)
    return sftp, transport

def is_processed(cursor, date):
    cursor.execute("SELECT 1 FROM toast_sync_log WHERE date = %s", (date,))
    return cursor.fetchone() is not None

def safe_float(val):
    try:
        if val is None or str(val).strip() in ('', 'nan', 'None'):
            return 0.0
        return float(float(str(val).replace(',', '').replace('$', '').strip()))
    except:
        return 0.0

def safe_int(val):
    try:
        if val is None or str(val).strip() in ('', 'nan', 'None'):
            return 0
        return int(int(float(str(val).replace(',', '').strip())))
    except:
        return 0

def process_payment_details(df, date):
    """Parse PaymentDetails.csv into payment records."""
    payments = []
    for _, row in df.iterrows():
        amount = safe_float(row.get('Amount') or row.get('amount') or 0)
        tip = safe_float(row.get('Tip') or row.get('tip') or 0)
        status = str(row.get('Payment Status') or row.get('Status') or '').strip()
        
        # Skip voided payments
        if status.upper() in ('VOIDED', 'VOID', 'REFUNDED'):
            continue
        
        payments.append({
            'date': date,
            'order_id': str(row.get('Order Id') or row.get('Order ID') or '')[:100],
            'check_id': str(row.get('Check Id') or row.get('Check ID') or '')[:100],
            'amount': amount,
            'tip': tip,
            'payment_type': str(row.get('Type') or row.get('Payment Type') or '')[:50],
            'card_type': str(row.get('Card Type') or '')[:50],
            'customer_name': str(row.get('Tab Name') or row.get('Customer') or '')[:255],
            'revenue_center': str(row.get('Revenue Center') or '')[:100],
            'status': status[:50],
        })
    return payments

def process_order_details(df):
    """Extract summary stats from OrderDetails.csv."""
    total_orders = len(df)
    total_guests = df['# of Guests'].apply(safe_int).sum() if '# of Guests' in df.columns else 0
    total_amount = df['Amount'].apply(safe_float).sum() if 'Amount' in df.columns else 0
    total_tax = df['Tax'].apply(safe_float).sum() if 'Tax' in df.columns else 0
    total_tips = df['Tip'].apply(safe_float).sum() if 'Tip' in df.columns else 0
    total_discounts = df['Discount Amount'].apply(safe_float).sum() if 'Discount Amount' in df.columns else 0
    return total_orders, total_guests, total_amount, total_tax, total_tips, total_discounts

def process_all_items(df):
    """Extract bay, golf, food/bev revenue from AllItemsReport.csv."""
    bay_rev = 0.0
    golf_rev = 0.0
    food_bev_rev = 0.0
    
    # Normalize column names
    df.columns = df.columns.str.strip()
    
    for _, row in df.iterrows():
        menu_name = str(row.get('Menu Name') or '').strip()
        net_amount = safe_float(row.get('Net Amount') or 0)
        
        # Skip summary rows (no Master ID / Item ID)
        master_id = row.get('Master ID') or row.get('Master_ID')
        item_id = row.get('Item ID') or row.get('Item_ID')
        if pd.isna(master_id) and pd.isna(item_id):
            continue
        
        menu_lower = menu_name.lower()
        if 'bay' in menu_lower or 'usage' in menu_lower:
            bay_rev += net_amount
        elif 'golf' in menu_lower:
            golf_rev += net_amount
        else:
            food_bev_rev += net_amount
    
    return bay_rev, golf_rev, food_bev_rev

def process_folder(sftp, cursor, db, folder_date):
    """Download and process one date folder."""
    folder_path = f'/{SFTP_SITE_FOLDER}/{folder_date}'
    
    try:
        files = sftp.listdir(folder_path)
    except Exception as e:
        logging.warning(f"Could not list {folder_path}: {e}")
        return
    
    # Read CSVs into memory
    csv_data = {}
    for fname in files:
        if not fname.endswith('.csv'):
            continue
        try:
            buf = io.BytesIO()
            sftp.getfo(f'{folder_path}/{fname}', buf)
            buf.seek(0)
            df = pd.read_csv(buf, dtype=str)
            df.columns = df.columns.str.strip()
            df = df.where(pd.notnull(df), None)
            csv_data[fname] = df
        except Exception as e:
            logging.warning(f"  Failed to read {fname}: {e}")
    
    # Process PaymentDetails
    payments = []
    total_cash = 0.0
    total_credit = 0.0
    if 'PaymentDetails.csv' in csv_data:
        payments = process_payment_details(csv_data['PaymentDetails.csv'], folder_date)
        for p in payments:
            ptype = (p['payment_type'] or '').lower()
            if 'cash' in ptype:
                total_cash += p['amount']
            else:
                total_credit += p['amount']
    
    # Process OrderDetails
    total_orders = total_guests = total_amount = total_tax = total_tips = total_discounts = 0
    if 'OrderDetails.csv' in csv_data:
        total_orders, total_guests, total_amount, total_tax, total_tips, total_discounts = \
            process_order_details(csv_data['OrderDetails.csv'])
        total_orders = int(total_orders)
        total_guests = int(total_guests)
        total_amount = float(total_amount)
        total_tax = float(total_tax)
        total_tips = float(total_tips)
        total_discounts = float(total_discounts)
    
    # Process AllItemsReport
    bay_rev = golf_rev = food_bev_rev = 0.0
    if 'AllItemsReport.csv' in csv_data:
        bay_rev, golf_rev, food_bev_rev = process_all_items(csv_data['AllItemsReport.csv'])
    
    total_revenue = float(total_cash + total_credit)
    total_cash = float(total_cash)
    total_credit = float(total_credit)
    bay_rev = float(bay_rev)
    golf_rev = float(golf_rev)
    food_bev_rev = float(food_bev_rev)
    total_orders = int(total_orders)
    total_guests = int(total_guests)
    total_tax = float(total_tax)
    total_tips = float(total_tips)
    total_discounts = float(total_discounts)
    
    # Upsert daily summary
    cursor.execute("""
        INSERT INTO toast_daily_summary 
          (date, total_revenue, bay_revenue, food_bev_revenue, golf_revenue,
           total_orders, total_guests, total_tax, total_tips, total_discounts,
           cash_revenue, credit_revenue)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          total_revenue=VALUES(total_revenue), bay_revenue=VALUES(bay_revenue),
          food_bev_revenue=VALUES(food_bev_revenue), golf_revenue=VALUES(golf_revenue),
          total_orders=VALUES(total_orders), total_guests=VALUES(total_guests),
          total_tax=VALUES(total_tax), total_tips=VALUES(total_tips),
          total_discounts=VALUES(total_discounts), cash_revenue=VALUES(cash_revenue),
          credit_revenue=VALUES(credit_revenue), updated_at=NOW()
    """, (folder_date, total_revenue, bay_rev, food_bev_rev, golf_rev,
          total_orders, total_guests, total_tax, total_tips, total_discounts,
          total_cash, total_credit))
    
    # Insert payments (delete old first to avoid dupes on re-run)
    cursor.execute("DELETE FROM toast_payments WHERE date = %s", (folder_date,))
    if payments:
        cursor.executemany("""
            INSERT INTO toast_payments 
              (date, order_id, check_id, amount, tip, payment_type, card_type,
               customer_name, revenue_center, status)
            VALUES (%(date)s, %(order_id)s, %(check_id)s, %(amount)s, %(tip)s,
                    %(payment_type)s, %(card_type)s, %(customer_name)s,
                    %(revenue_center)s, %(status)s)
        """, payments)
    
    # Mark as processed
    cursor.execute("""
        INSERT INTO toast_sync_log (date, status, orders_imported, payments_imported)
        VALUES (%s, 'success', %s, %s)
        ON DUPLICATE KEY UPDATE status='success', orders_imported=%s, payments_imported=%s, synced_at=NOW()
    """, (folder_date, total_orders, len(payments), total_orders, len(payments)))
    
    db.commit()
    logging.info(f"  ✅ {folder_date}: revenue=${total_revenue:.2f}, orders={total_orders}, payments={len(payments)}")

def main():
    logging.info("🔌 Connecting to SFTP...")
    sftp, transport = sftp_connect()
    logging.info("✅ SFTP connected")
    
    db = get_db()
    cursor = db.cursor()
    
    # Get all date folders
    all_folders = sorted(sftp.listdir(f'/{SFTP_SITE_FOLDER}'))
    date_folders = [f for f in all_folders if re.match(r'^\d{8}$', f)]
    logging.info(f"📂 Found {len(date_folders)} date folders to process")
    
    processed = 0
    skipped = 0
    for folder in date_folders:
        if is_processed(cursor, folder):
            skipped += 1
            continue
        logging.info(f"📂 Processing {folder}...")
        try:
            process_folder(sftp, cursor, db, folder)
            processed += 1
        except Exception as e:
            logging.error(f"  ❌ Error processing {folder}: {e}")
            cursor.execute("""
                INSERT INTO toast_sync_log (date, status, error_message)
                VALUES (%s, 'error', %s)
                ON DUPLICATE KEY UPDATE status='error', error_message=%s, synced_at=NOW()
            """, (folder, str(e), str(e)))
            db.commit()
    
    cursor.close()
    db.close()
    sftp.close()
    transport.close()
    
    logging.info(f"🎉 Import complete! Processed: {processed}, Skipped (already done): {skipped}")

if __name__ == "__main__":
    main()
