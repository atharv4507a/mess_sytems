---
trigger: always_on
---

1. Component Reusability Rule:
Jar code lihitatana already available component asel, tar navin custom component banvu naka — existing component reuse kara.

2. New Component Storage Rule:
Jar navin component banvaychi garaj padli, tar to `.agents/rules/components` madhyech add kara — random folder madhye nahi.

3. Folder Structure Discipline:
Project madhil predefined folder structure disturb karu naka. Sarva files tyach structure nusar create kara.

4. Naming Convention Rule:
- Components → PascalCase (Example: UserCard.jsx)
- Functions → camelCase
- Constants → UPPER_CASE

5. Clean Code Rule:
- Unused imports nako
- Console logs production code madhye nako
- Code short, readable ani maintainable theva

6. API Handling Rule:
Sarva API calls centralized file madhun kara (e.g. api.js). Direct fetch/axios component madhye use karu naka.

7. Error Handling Rule:
Pratek API call la try-catch ani proper error handling aselach pahije.

8. UI Consistency Rule:
- Tailwind classes consistent theva
- Same UI patterns reuse kara (buttons, inputs, cards)

9. State Management Rule:
- Small state → useState
- Complex state → useReducer / Context API
- Unnecessary re-renders avoid kara

10. Import Path Rule:
Relative paths messy hot asel tar absolute imports use kara.

11. DRY Principle Rule:
Same code repeat hot asel tar reusable function/component banva.

12. Performance Rule:
- Large lists → pagination / lazy loading
- Images optimize kara
- React.memo, lazy loading use kara jithe possible ahe

13. Security Rule:
Sensitive data (tokens, API keys) hardcode karu naka — .env madhye store kara.

14. Comments Rule:
Complex logic sathi short meaningful comments add kara — over-commenting nako.

15. Git Discipline Rule:
- Proper commit messages use kara
- Random changes push karu naka
- Feature-wise commits kara

16. Responsiveness Rule:
Sarva UI mobile, tablet ani desktop compatible asla pahije.

17. Dark/Light Mode Rule:
Jar project madhe dark/light mode asel, tar navin components tyala compatible asle pahijet.

18. Dependency Rule:
Unnecessary libraries install karu naka — already available tools use kara.

19. Validation Rule:
Forms madhye proper validation aselach pahije (required, format checks, etc.)

20. File Size Rule:
Ekach file khup mothi karu naka (>300-400 lines) — modular breakup kara.

21. Code Decision Rule:
Kahi pan navin code generate karanyapurvi:
- First existing codebase check kara
- Mag reuse karaycha try kara
- Nantar navin code generate kara

22. Axios Service & Authentication Rule:
Project madhil sarva API calls sathi `api.js` chi axios service file ch use kara. Jar API response madhe `401` status code aala (token expired/unauthorized), tar axios interceptor / middleware madhun user la direct logout (tokens clear karun login page var redirect) kara.