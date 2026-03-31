---
trigger: always_on
---

# Backend Code Style Rules

1. **Helper Functions Reusability Rule:**
Backend madhil jevde existing helper functions ahet te reuse karne compulsory ahe. Same logic parat parat lihu naye.

2. **Optimized Data Creation Rule (Req.Body Modification):**
Code optimize thevnyasathi, `req.body` object direct modify kara (jasa backend or model la expect ahe tasa data format kara) ani create karta veli direct `Model.create(req.body)` pass kara. Manually ek-ek field set karat basane taalun code clean theva.

3. **Model Validation & Security Rule:**
Aapan je navin models banavnar ahot, tyat strict database/model level validations aselach pahije. Validations madhe kontihi vulnerability thevu naka (e.g., exact length, data type check, and proper constraints). Insecure inputs handle kele pahijet.

4. **Status Code Standard Rule:**
- **401 (Unauthorized)**: Ha code PHAKAT 'Invalid Token' kiwa 'Expired Token' sathi vapra. Tyat 'Identity' chya fail sathi redirection hot aslyamule logic error sathi to vapru naye.
- **422 (Unprocessable Entity)**: 'Validation errors' (e.g., wrong credentials, mandatory field missing, logic failure) sathi PHAKAT 422 haa code vaprava.
- **200/201 (Success)**: Successful response sathi.
