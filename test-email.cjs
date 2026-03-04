const { z } = require('./node_modules/zod/index.cjs');

const schema = z.object({ email: z.string().email() });

const testEmails = [
  'test@example.com',
  'user+tag@gmail.com',
  'first.last@company.co.uk',
  'test@test',
  'invalid',
  'user@domain.c',
  'noreply@acuityscheduling.com',
  'john.doe+clinic@gmail.com',
  'JOHN.DOE@GMAIL.COM',
  'user@sub.domain.com',
];

for (const email of testEmails) {
  const result = schema.safeParse({ email });
  if (result.success) {
    console.log('VALID: ' + email);
  } else {
    const issue = result.error.issues[0];
    console.log('INVALID: ' + email + ' -> ' + issue.message);
  }
}
