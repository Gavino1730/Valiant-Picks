# Security Policy

## Reporting a Vulnerability

The security of School Picks is important to us. If you discover a security vulnerability, please follow these steps:

### 🚨 DO NOT Create a Public Issue

Security vulnerabilities should **never** be reported through public GitHub issues.

### ✅ How to Report

**Email**: your-email@example.com

**Subject**: `[SECURITY] Brief description of vulnerability`

### What to Include

Please provide as much information as possible:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** (what could an attacker do?)
4. **Affected versions** (if known)
5. **Suggested fix** (if you have one)
6. **Your contact information** for follow-up

### Example Report

```
Subject: [SECURITY] SQL Injection in Bet Placement

Description:
The bet placement endpoint is vulnerable to SQL injection through the
'selected_team' parameter.

Steps to Reproduce:
1. Login as a user
2. Send POST to /api/bets with malicious SQL in selected_team
3. Database query executes arbitrary SQL

Impact:
Attacker could read, modify, or delete any data in the database,
including user credentials and betting information.

Affected Versions: v1.0.0 and earlier

Suggested Fix:
Use parameterized queries instead of string concatenation.

Contact: security-researcher@example.com
```

---

## Response Timeline

We take security seriously and will respond as follows:

- **24-48 hours**: Acknowledge receipt of your report
- **1 week**: Provide initial assessment and expected timeline
- **2-4 weeks**: Develop and test fix (depends on severity)
- **Upon fix**: Notify you before public disclosure
- **After fix deployed**: Publish security advisory

### Severity Levels

**Critical** (Fix within 48 hours)
- Remote code execution
- SQL injection
- Authentication bypass
- Sensitive data exposure

**High** (Fix within 1 week)
- XSS vulnerabilities
- CSRF attacks
- Privilege escalation
- Session hijacking

**Medium** (Fix within 2 weeks)
- Information disclosure
- Denial of service
- Less severe injection attacks

**Low** (Fix within 4 weeks)
- Security misconfigurations
- Minor information leaks
- Rate limiting issues

---

## Security Measures

### Current Protections

#### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Token expiration (24 hours)
- ✅ Role-based access control (admin/user)
- ✅ Protected admin routes with middleware

#### Database Security
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Supabase Row Level Security (RLS) policies
- ✅ Input validation and sanitization
- ✅ Prepared statements for all queries
- ✅ Database connection encryption (SSL)

#### API Security
- ✅ CORS configuration (whitelist origins)
- ✅ Request validation middleware
- ✅ Error handling (no sensitive info in errors)
- ✅ Secure headers (helmet.js recommended)
- ✅ HTTPS in production

#### Frontend Security
- ✅ No sensitive data in localStorage
- ✅ XSS prevention (React escaping)
- ✅ CSRF token validation (for sensitive actions)
- ✅ Content Security Policy headers
- ✅ Secure cookie flags

#### Infrastructure
- ✅ Environment variables for secrets
- ✅ No hardcoded credentials
- ✅ Automated SSL certificates (Cloudflare/Railway)
- ✅ Regular dependency updates
- ✅ Secure hosting platforms (Railway, Cloudflare, Supabase)

### Recommended Additions

For production deployments, consider adding:

#### Rate Limiting
```javascript
// Recommended: Express rate limit
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // limit login attempts
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

#### Security Headers
```javascript
// Recommended: Helmet.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

#### Request Logging
```javascript
// Recommended: Winston or Morgan
const morgan = require('morgan');
const winston = require('winston');

// Log to file for security auditing
app.use(morgan('combined', { stream: winstonStream }));
```

---

## Secure Configuration

### Environment Variables

**Required Production Settings:**

```env
# Security
NODE_ENV=production
JWT_SECRET=<minimum-64-character-random-string>
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

# Never commit these!
# Use different secrets for dev/prod
# Rotate secrets every 90 days
```

**Generate Secure JWT Secret:**
```bash
# Use this to generate a secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Database Configuration

**Supabase RLS Policies** (already implemented):
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can only create bets for themselves
CREATE POLICY "Users can create own bets"
  ON bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Password Requirements

Enforce strong passwords:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

```javascript
// Example validation
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

---

## Known Security Considerations

### Current Limitations

1. **No Rate Limiting** (Development)
   - Impact: Susceptible to brute force attacks
   - Mitigation: Implement rate limiting before production
   - Status: Planned for v1.1.0

2. **Session Management**
   - Impact: JWT tokens valid until expiration (no revocation)
   - Mitigation: Keep token expiration short (24 hours)
   - Status: Token blacklist planned for v1.2.0

3. **File Uploads** (If implemented)
   - Impact: Potential for malicious file uploads
   - Mitigation: Not currently implemented
   - Status: Will include proper validation if added

### Resolved Issues

See [CHANGELOG.md](CHANGELOG.md) for history of security fixes.

---

## Security Best Practices

### For Developers

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   *.key
   *.pem
   ```

2. **Validate All Input**
   ```javascript
   // Always validate user input
   const { error } = schema.validate(req.body);
   if (error) return res.status(400).json({ error: error.message });
   ```

3. **Use Parameterized Queries**
   ```javascript
   // ✅ Good
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('id', userId);

   // ❌ Bad - vulnerable to SQL injection
   const query = `SELECT * FROM users WHERE id = '${userId}'`;
   ```

4. **Sanitize Output**
   ```javascript
   // Remove sensitive fields before sending response
   const userResponse = {
     id: user.id,
     username: user.username,
     balance: user.balance
     // Don't send: password, email, tokens
   };
   ```

5. **Keep Dependencies Updated**
   ```bash
   # Check for vulnerabilities regularly
   npm audit
   npm audit fix

   # Update dependencies
   npm update
   ```

### For Admins

1. **Secure Admin Credentials**
   - Use strong, unique passwords
   - Enable 2FA on GitHub, Railway, Cloudflare, Supabase
   - Don't share admin accounts
   - Regular password rotation (every 90 days)

2. **Monitor Logs**
   - Check Railway logs daily
   - Review Supabase metrics weekly
   - Set up alerts for unusual activity
   - Monitor failed login attempts

3. **Regular Backups**
   - Enable Supabase automatic backups
   - Download manual backups weekly
   - Store backups securely (encrypted)
   - Test restoration process quarterly

4. **Access Control**
   - Limit who has admin access
   - Use separate accounts (no shared logins)
   - Revoke access when no longer needed
   - Audit admin actions regularly

### For Users

1. **Protect Your Account**
   - Use strong, unique password
   - Don't share your credentials
   - Logout on shared devices
   - Report suspicious activity

2. **Be Cautious**
   - Verify you're on the real site (check URL)
   - Don't click suspicious links in emails
   - Report phishing attempts
   - Keep your browser updated

---

## Security Checklist

Before deploying to production:

### Configuration
- [ ] Changed default JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Enabled HTTPS everywhere
- [ ] Configured CORS whitelist
- [ ] Set secure cookie flags
- [ ] Configured CSP headers

### Code
- [ ] All user inputs validated
- [ ] Parameterized queries used
- [ ] Error messages don't leak info
- [ ] No console.log in production
- [ ] Dependencies updated
- [ ] No hardcoded secrets

### Infrastructure
- [ ] SSL certificates configured
- [ ] Database backups enabled
- [ ] Monitoring set up
- [ ] Rate limiting configured
- [ ] Firewall rules set
- [ ] DDoS protection enabled

### Access Control
- [ ] Admin routes protected
- [ ] RLS policies verified
- [ ] Strong passwords enforced
- [ ] Admin accounts documented
- [ ] Access logs enabled
- [ ] 2FA enabled where possible

---

## Vulnerability Disclosure Policy

### Responsible Disclosure

We follow responsible disclosure practices:

1. **Private Report**: You report to us privately
2. **Investigation**: We investigate and develop fix
3. **Coordination**: We coordinate disclosure timeline
4. **Public Disclosure**: We publicly disclose after fix is deployed
5. **Credit**: We credit you in security advisory (if desired)

### Public Disclosure Timeline

- **Critical**: 48 hours after fix deployed
- **High**: 1 week after fix deployed
- **Medium/Low**: 2 weeks after fix deployed

### Security Advisories

Published at: `https://github.com/yourusername/school-picks/security/advisories`

Format:
- CVE identifier (if applicable)
- Affected versions
- Vulnerability description
- Impact assessment
- Fixed versions
- Workarounds (if any)
- Credit to reporter

---

## Bug Bounty

Currently, we do not offer a paid bug bounty program. However:

- 🏆 Security researchers will be credited in advisories
- 🎖️ Listed as security contributors
- 📢 Mentioned in release notes
- 🙏 Our sincere gratitude!

For schools or organizations using School Picks who want to offer bounties for their deployment, we recommend:
- Define scope clearly
- Set reasonable rewards
- Use established platforms (HackerOne, Bugcrowd)

---

## Security Resources

### Educational
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Check for vulnerable dependencies
- [Snyk](https://snyk.io/) - Automated vulnerability scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing tool
- [SQLMap](https://sqlmap.org/) - SQL injection testing (use responsibly)

### Supabase Security
- [Supabase Security Docs](https://supabase.com/docs/guides/platform/security)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## Contact

**Security Email**: your-email@example.com  
**PGP Key**: [Link to PGP key if available]  
**Response Time**: Within 48 hours

For non-security issues:
- 🐛 Bugs: [GitHub Issues](https://github.com/yourusername/school-picks/issues)
- 💬 Questions: [GitHub Discussions](https://github.com/yourusername/school-picks/discussions)

---

## Acknowledgments

We'd like to thank the following security researchers who have helped make School Picks more secure:

- *No reports yet - be the first!*

---

**Last Updated**: January 14, 2026  
**Version**: 1.0

Thank you for helping keep School Picks and our users safe! 🔒
