import { computeSummary, sanitizeNumericInput, parseFlexibleMoney, formatMoneyInput, formatPctInput, suggestFairSplit } from '/shared/money.js';

/* Honeypot frontend — vanilla JS, no build step. One screen + slide-over dialogs. */

const I18N = {
  en: {
    profileLabel: 'Current profile',
    monthLabel: 'Month',
    settings: 'Settings',
    history: 'History',
    leftoverLog: "Leftover log",
    closeMonth: 'Close month',
    personalObligatory: 'Personal expenses',
    noMonthTitle: 'No month open',
    noMonthText: 'Create the current month to start planning.',
    createMonth: 'Create month',
    monthPlan: 'Month plan',
    liveFigures: 'Live figures',
    spendingLog: 'Spending log',
    whoAreYou: 'Which one are you?',
    whoAreYouHint: "This only prefills forms and picks your theme. Both partners can edit everything.",
    close: 'Close',
    monthSummary: 'Month summary',
    salaries: 'Salaries',
    salaryFor: "Salary: {name}",
    fixedShared: 'Fixed shared costs',
    variableShared: 'Variable shared costs',
    label: 'Name',
    amount: 'Amount',
    partnerShare: '{name} chips in',
    add: 'Add',
    remove: 'Remove',
    save: 'Save',
    saved: "Saved.",
    saving: "Saving…",
    transferAfterPayday: 'Contribution to shared costs',
    guaranteedLeft: 'For sure',
    plannedLeft: 'After plan',
    projectedLeft: 'So far',
    potBalance: 'Left of shared plan',
    settleUp: 'Between you two',
    settleLine: 'This month {from} pays {to} {amount}.',
    unplanned: 'Unplanned',
    planned: 'Planned',
    actual: 'Actual',
    date: 'Date',
    description: 'Description',
    payer: "Paid by",
    potPaid: "Pot (no individual payer)",
    linkItem: 'Planned item',
    none: '\u2014',
    addExpense: 'Add expense',
    open: 'open',
    closed: 'closed',
    monthClosed: 'This month is closed and read-only.',
    confirmClose: 'Close this month? Plan and expenses will lock.',
    personalSupport: 'Personal support',
    contributions: 'Contributions',
    paid: "Paid out of pocket",
    themeColors: 'Theme',
    mode: 'Mode',
    light: 'light',
    dark: 'dark',
    currency: "Currency",
    categories: 'Expense categories',
    language: 'Language',
    category: 'Category',
    note: 'Note',
    addEntry: 'Add entry',
    noLeftoverMonth: 'No closed month yet \u2014 the leftover log opens after the first close.',
    readOnly: 'Read-only',
    editHint: 'Editable only for the most recently closed month.',
    historyEmpty: 'No closed months yet.',
    error: 'Error',
    cancel: 'Cancel',
    confirm: 'Confirm',
    noItems: 'Nothing planned yet.',
    noExpenses: 'No spending logged yet.',
    nothingYet: 'Nothing here yet.',
    balance: 'Balance',
    pot: 'Pot',
    paidByStrip: 'Paid by {name}',
    resetTheme: 'Reset to default',
    presetPaper: 'Paper',
    presetInk: 'Ink',
    presetSunrise: 'Sunrise',
    presetBerry: 'Berry',
    presetOcean: 'Ocean',
    presetContrast: 'High contrast',
    profile: 'Profile',
    navPanels: 'Panels',
    personalExpensesAria: 'Personal expenses list',
    centerAria: 'Month plan and spending',
    splitOfPlan: '% of shared costs',
    ofPlan: "of shared costs",
    coversSpending: 'Paid so far, by whom',
    ofIncome: '% of own salary',
    fairIncome: "Fair share = equal % of own salary — both pay {pct}%",
    splitLabel: 'Split',
    splitHint: 'Split this cost between {a} and {b} — blank = automatic split by salary.',
    auto: 'auto',
    sectionProfile: 'Your profile',
    profileHint: 'Name, theme and mode apply only to you — the other partner has their own.',
    sectionApp: 'App',
    newMonth: 'New month',
    noMonthsYet: 'No months yet',
    discardChanges: 'Discard unsaved settings changes?',
    confirmDelete: 'Delete this item? This cannot be undone.',
    savedSkipped: 'Saved. {n} row(s) skipped — they need a name and an amount above 0.',
    edit: 'Edit',
    newItem: 'New item',
    err_month_closed: 'This month is closed.',
    err_month_exists: 'That month already exists.',
    err_month_open: 'Another month is still open.',
    err_invalid: 'Invalid input.',
    err_history_closed_only: 'History is available for closed months only.',
    err_not_closed: 'The leftover log is for closed months.',
    err_not_most_recent: 'Only the most recently closed month is editable.',
    err_internal: 'Something went wrong on the server.',
    /* tooltips: one tip<Key> per visible label key (guarded by tests/ui-static.test.js) */
    tipSalaries: 'What each partner earns this month (net). Salaries set the default split of shared costs: the higher the salary, the bigger the share.',
    tipSalaryFor: 'Net salary of {name} for this month. It drives the automatic split of shared costs.',
    tipFixedShared: 'Shared costs that stay the same every month — rent, utilities, internet. They are assumed paid automatically as part of the shared plan.',
    tipVariableShared: 'Shared costs that vary — groceries, eating out. Plan an estimate here; actual spending is logged as expenses below.',
    tipPersonalObligatory: 'Personal expenses of this partner. They reduce only their own leftover; the other partner can chip in a % per item.',
    tipMonthPlan: 'Everything planned for this month: salaries, shared costs, personal costs. Every edit saves automatically.',
    tipLiveFigures: 'The money picture of this month, recomputed live while you edit the plan or log expenses.',
    tipSpendingLog: 'Every expense logged this month. Link it to a planned item or leave it unplanned, and pick who paid.',
    tipLabel: 'Name of this item.',
    tipAmount: 'Amount in the app currency, e.g. 120.50. Type digits and one decimal separator.',
    tipPartnerShare: '{name} chips in this % of this personal cost. It appears as its own line in the month summary and never changes the shared split.',
    tipSplitLabel: 'Split this one cost between {a} and {b}. Each % is that person’s part of this one cost. Blank = automatic split by salary; the two inputs stay in sync to 100%.',
    tipDate: 'Date of the expense — must be a real day within the current month.',
    tipCategory: 'Category of the expense, from the list managed in Settings.',
    tipDescription: 'What the expense was for.',
    tipLinkItem: 'Which planned variable item this expense belongs to, or unplanned.',
    tipPayer: 'Who actually paid: a partner (fronted personally, settled at close) or the shared plan (no individual payer).',
    tipProfile: 'Which partner this leftover entry belongs to.',
    tipNote: 'Free-text note for this entry.',
    tipCurrency: 'Three-letter currency code used for all amounts, e.g. EUR or PLN.',
    tipLanguage: 'Language of the app interface.',
    tipCategories: 'Categories used for expenses and leftover entries. The list is editable here.',
    tipThemeColors: 'Color theme preset for your profile only — the other partner has their own.',
    tipMode: 'Light or dark mode for your profile only.',
    tipSectionProfile: 'Name, theme and mode are saved per partner profile. Only your own profile is editable here.',
    tipSectionApp: 'Settings shared by the whole app: currency, language, expense categories.',
    tipSettings: 'App and profile settings, with one Save button at the bottom.',
    tipHistory: 'Closed months, newest first, read-only.',
    tipLeftoverLog: 'What each partner did with their leftover money after the most recently closed month.',
    tipCloseMonth: 'Freezes this month forever: the plan and expenses lock and a summary snapshot is stored. This cannot be undone.',
    tipNewMonth: 'Creates the next free month, pre-filled with editable defaults from the most recent month. Nothing else carries over.',
    tipCreateMonth: 'Creates the current month so you can start planning.',
    tipNoMonthTitle: 'No month is open. Months are calendar months and at most one is open at a time.',
    tipNoMonthText: 'Create the current month to start planning; it pre-fills editable defaults from the most recent month.',
    tipNoItems: 'Nothing here yet — use the Add button to create an item.',
    tipNoExpenses: 'No expenses logged yet — use the form above.',
    tipNothingYet: 'Nothing logged here yet.',
    tipHistoryEmpty: 'Closed months appear here after you close them.',
    tipNoLeftoverMonth: 'The leftover log opens after the first month is closed.',
    tipOpen: 'This month is open — the plan and expenses are editable.',
    tipClosed: 'This month is closed — read-only, except the leftover log of the most recent closed month.',
    tipBalance: 'Net amount to settle between the two partners from personally fronted expenses: who pays whom at close.',
    tipTransferAfterPayday: '{name}’s part of the shared costs this month: the salary-based share of the whole shared plan (an item with a custom % overrides it for that item). Worked with your numbers: salary {salary} of {combined} combined income, shared plan {plan} → contribution {amount}.',
    tipGuaranteedLeft: 'Money {name} keeps no matter what: salary minus fixed-cost share minus personal costs. Your numbers: {salary} − {fixed} − {personal} = {left}.',
    tipPlannedLeft: 'Guaranteed leftover minus the planned share of variable shared costs. Your numbers: {prev} − {var} = {left}.',
    tipProjectedLeft: 'Leftover if spending stays as logged so far: salary minus fixed share minus actual expenses minus personal costs. Your numbers: {salary} − {fixed} − {spent} − {personal} = {left}.',
    tipPotBalance: 'What remains of the shared plan: fixed costs are assumed paid automatically, plan-paid expenses are paid from it. Your numbers: plan {plan} − fixed {fixed} − plan-paid spending {potpaid} = {balance}. At close it is returned to each partner by salary share.',
    tipSettleUp: 'Expenses fronted personally are evened out at close so they end up split by salary share. This month: {from} pays {to} {amount}.',
    tipOfIncome: 'Contribution as a % of {name}’s own salary: {amount} of {salary} = {pct}%. When both partners’ percentages are equal, the split is fair.',
    tipSplitOfPlan: 'Planned split of the shared plan: {a} {ca}% and {b} {cb}% of the {plan} plan — by salary ({sa} / {sb}) unless an item has a custom %. This bar measures the plan, not who actually paid.',
    tipCoversSpending: 'Of the {spent} actually spent so far, who paid: {a} fronted {fa}%, {b} fronted {fb}%, the shared plan paid {fp}%. This bar measures real payments, unlike the plan bar above.',
    tipFairIncome: 'Fair means both partners contribute the same % of their own salary to shared costs. Right now: {a} {ia}%, {b} {ib}%.',
    tipEditHint: 'The leftover log is editable only for the most recently closed month.',
    tipReadOnly: 'Older closed months are read-only.',
    tipMonthClosed: 'Closed months are read-only.',
    tipContributions: 'How much each partner contributes to shared costs this month. Worked example (first row): {name} — salary {salary} of {combined} combined, shared plan {plan} → {amount}.',
    applyAll: 'Apply all suggestions ({n})',
    tipApplyAll: 'Accepts every suggested split at once: each auto item gets the suggested %, filled in as normal editable values you can change or reset to auto. Nothing is applied silently.',
    suggestionChip: 'Suggested split {a}/{b} — click to accept',
    tipSuggestion: 'The app suggests a split that evens out the salary % for both of you — {a} would pay {pa}% and {b} {pb}% of this cost. Click to accept; type your own numbers to ignore it.',
    tipSuggestNotExact: 'An equal % of salary is not fully reachable with the remaining auto items — this {pa}/{pb} is the closest possible split for {a}/{b}.',
    tipPaid: 'How much each partner fronted personally for shared expenses; at close these are evened out by salary share. Example row: {name} fronted {amount}.',
    tipWhoAreYou: 'Pick your profile — it only prefills forms and applies your theme. Both partners can edit everything.',
  },
  pl: {
    profileLabel: 'Aktualny profil',
    monthLabel: 'Miesi\u0105c',
    settings: 'Ustawienia',
    history: 'Historia',
    leftoverLog: "Dziennik wolnych środków",
    closeMonth: 'Zamknij miesi\u0105c',
    personalObligatory: 'Wydatki osobiste',
    noMonthTitle: 'Nie otwarto miesi\u0105ca',
    noMonthText: 'Utw\u00f3rz bie\u017c\u0105cy miesi\u0105c, \u017ceby zacz\u0105\u0107 planowanie.',
    createMonth: 'Utw\u00f3rz miesi\u0105c',
    monthPlan: 'Plan miesi\u0105ca',
    liveFigures: 'Na bie\u017c\u0105co',
    spendingLog: 'Rejestr wydatk\u00f3w',
    whoAreYou: 'Kim jeste\u015b?',
    whoAreYouHint: "To tylko wstępnie wypełnia formularze i wybiera Twój motyw. Obydwoje możecie edytować wszystko.",
    close: 'Zamknij',
    monthSummary: 'Podsumowanie miesi\u0105ca',
    salaries: 'Pensje',
    salaryFor: 'Pensja: {name}',
    fixedShared: 'Sta\u0142e koszty wsp\u00f3lne',
    variableShared: 'Zmienne koszty wsp\u00f3lne',
    label: 'Nazwa',
    amount: 'Kwota',
    partnerShare: 'Dok\u0142ada {name}',
    add: 'Dodaj',
    remove: 'Usu\u0144',
    save: 'Zapisz',
    saved: 'Zapisano.',
    saving: "Zapisywanie…",
    transferAfterPayday: 'Udzia\u0142 we wsp\u00f3lnych wydatkach',
    guaranteedLeft: 'Na pewno',
    plannedLeft: 'Po planie',
    projectedLeft: 'Dot\u0105d',
    potBalance: 'Pozosta\u0142o z planu',
    settleUp: 'Mi\u0119dzy wami',
    settleLine: 'W tym miesi\u0105cu {from} p\u0142aci {to} {amount}.',
    unplanned: 'Pozaplanowe',
    planned: 'Planowane',
    actual: 'Rzeczywiste',
    date: 'Data',
    description: 'Opis',
    payer: "Kto zapłacił",
    potPaid: 'Pula (bez p\u0142atnika)',
    linkItem: 'Zaplanowana pozycja',
    none: '\u2014',
    addExpense: 'Dodaj wydatek',
    open: 'otwarty',
    closed: 'zamkni\u0119ty',
    monthClosed: 'Ten miesi\u0105c jest zamkni\u0119ty \u2014 tylko do odczytu.',
    confirmClose: 'Zamkn\u0105\u0107 ten miesi\u0105c? Plan i wydatki zostan\u0105 zablokowane.',
    personalSupport: 'Wsparcie partnera',
    contributions: 'Sk\u0142adki',
    paid: 'Zap\u0142acone z w\u0142asnej kieszeni',
    themeColors: 'Motyw',
    mode: 'Tryb',
    light: 'jasny',
    dark: 'ciemny',
    currency: "Waluta",
    categories: 'Kategorie wydatk\u00f3w',
    language: 'J\u0119zyk',
    category: 'Kategoria',
    note: 'Notatka',
    addEntry: 'Dodaj wpis',
    noLeftoverMonth: 'Nie ma jeszcze zamkni\u0119tego miesi\u0105ca \u2014 dziennik otworzy si\u0119 po pierwszym zamkni\u0119ciu.',
    readOnly: 'Tylko do odczytu',
    editHint: 'Edytowalne tylko w ostatnio zamkni\u0119tym miesi\u0105cu.',
    historyEmpty: 'Nie zamkni\u0119to jeszcze \u017cadnego miesi\u0105ca.',
    error: 'B\u0142\u0105d',
    cancel: 'Anuluj',
    confirm: 'Potwierd\u017a',
    noItems: 'Jeszcze nic nie zaplanowano.',
    noExpenses: 'Nie zapisano jeszcze \u017cadnych wydatk\u00f3w.',
    nothingYet: 'Jeszcze nic tu nie ma.',
    balance: 'Bilans',
    pot: 'Pula',
    paidByStrip: 'Zapłacił(a): {name}',
    resetTheme: 'Przywróć domyślne',
    presetPaper: 'Papier',
    presetInk: 'Atrament',
    presetSunrise: 'Wschód słońca',
    presetBerry: 'Jagoda',
    presetOcean: 'Ocean',
    presetContrast: 'Wysoki kontrast',
    profile: "Osoba",
    navPanels: "Panele",
    personalExpensesAria: "Lista wydatków osobistych",
    centerAria: "Plan miesiąca i wydatki",
    splitOfPlan: '% wspólnych kosztów',
    ofPlan: "kosztów wspólnych",
    coversSpending: 'Kto już zapłacił',
    ofIncome: '% własnej pensji',
    fairIncome: "Uczciwy podział = równy % pensji — obie strony płacą po {pct}%",
    splitLabel: 'Podział',
    splitHint: 'Podziel ten koszt między {a} a {b} — puste = automatyczny podział wg pensji.',
    auto: 'auto',
    sectionProfile: 'Twój profil',
    profileHint: 'Nazwa, motyw i tryb dotyczą tylko Ciebie — druga osoba ma własne.',
    sectionApp: 'Aplikacja',
    newMonth: 'Nowy miesiąc',
    noMonthsYet: 'Brak miesięcy',
    discardChanges: 'Odrzucić niezapisane zmiany ustawień?',
    confirmDelete: 'Usunąć ten wpis? Tej operacji nie można cofnąć.',
    savedSkipped: 'Zapisano. Pominięto {n} wiersz(y) — potrzebują nazwy i kwoty powyżej 0.',
    edit: 'Edytuj',
    newItem: 'Nowa pozycja',
    err_month_closed: 'Ten miesiąc jest zamknięty.',
    err_month_exists: 'Ten miesiąc już istnieje.',
    err_month_open: 'Inny miesiąc jest jeszcze otwarty.',
    err_invalid: 'Nieprawidłowe dane.',
    err_history_closed_only: 'Historia jest dostępna tylko dla zamkniętych miesięcy.',
    err_not_closed: 'Dziennik wolnych środków dotyczy zamkniętych miesięcy.',
    err_not_most_recent: 'Edytować można tylko ostatnio zamknięty miesiąc.',
    err_internal: 'Coś poszło nie tak po stronie serwera.',
    /* podpowiedzi: jeden klucz tip<Key> na każdy widoczny klucz etykiety (pilnowane testem) */
    tipSalaries: 'Ile każda osoba zarabia w tym miesiącu (netto). Pensje wyznaczają domyślny podział kosztów wspólnych: im wyższa pensja, tym większy udział.',
    tipSalaryFor: 'Pensja netto: {name} w tym miesiącu. To ona wyznacza automatyczny podział kosztów wspólnych.',
    tipFixedShared: 'Wspólne koszty stałe co miesiąc — czynsz, prąd, internet. Są uznawane za opłacone automatycznie w ramach planu wspólnego.',
    tipVariableShared: 'Wspólne koszty zmienne — zakupy, jedzenie na mieście. Zaplanuj tu szacunek; rzeczywiste wydatki rejestrujesz poniżej.',
    tipPersonalObligatory: 'Wydatki osobiste tej osoby. Obniżają tylko jej własne wolne środki; druga osoba może dołożyć się procentem od pozycji.',
    tipMonthPlan: 'Wszystko zaplanowane na ten miesiąc: pensje, koszty wspólne, osobiste. Każda zmiana zapisuje się automatycznie.',
    tipLiveFigures: 'Obraz pieniędzy na ten miesiąc — przeliczany na bieżąco podczas edycji planu i rejestrowania wydatków.',
    tipSpendingLog: 'Każdy wydatek zarejestrowany w tym miesiącu. Powiąż go z zaplanowaną pozycją albo zostaw pozaplanowy i wybierz, kto zapłacił.',
    tipLabel: 'Nazwa tej pozycji.',
    tipAmount: 'Kwota w walucie aplikacji, np. 120,50. Wpisuj cyfry i jeden przecinek lub kropkę.',
    tipPartnerShare: '{name} dokłada ten % tej osobistej pozycji. Pokazuje się jako osobna linia w podsumowaniu miesiąca i nigdy nie zmienia podziału wspólnego.',
    tipSplitLabel: 'Podziel ten jeden koszt między {a} a {b}. Każdy % to część tej jednej osoby za ten jeden koszt. Puste = automatyczny podział wg pensji; oba pola sumują się do 100%.',
    tipDate: 'Data wydatku — musi to być prawdziwy dzień bieżącego miesiąca.',
    tipCategory: 'Kategoria wydatku z listy zarządzanej w Ustawieniach.',
    tipDescription: 'Na co był ten wydatek.',
    tipLinkItem: 'Do której zaplanowanej pozycji zmiennej należy ten wydatek — albo pozaplanowy.',
    tipPayer: 'Kto faktycznie zapłacił: osoba (zapłacone z własnej kieszeni, rozliczane przy zamknięciu) albo plan wspólny (bez indywidualnego płatnika).',
    tipProfile: 'Której osoby dotyczy ten wpis dziennika wolnych środków.',
    tipNote: 'Dowolna notatka do tego wpisu.',
    tipCurrency: 'Trzyliterowy kod waluty dla wszystkich kwot, np. EUR albo PLN.',
    tipLanguage: 'Język interfejsu aplikacji.',
    tipCategories: 'Kategorie używane przy wydatkach i wpisach dziennika. Lista jest edytowalna tutaj.',
    tipThemeColors: 'Wariant kolorystyczny tylko dla Twojego profilu — druga osoba ma własny.',
    tipMode: 'Tryb jasny lub ciemny tylko dla Twojego profilu.',
    tipSectionProfile: 'Nazwa, motyw i tryb są zapisywane osobno dla każdego profilu. Tutaj edytujesz tylko własny.',
    tipSectionApp: 'Ustawienia wspólne dla całej aplikacji: waluta, język, kategorie wydatków.',
    tipSettings: 'Ustawienia aplikacji i profilu — jednym przyciskiem Zapisz na dole.',
    tipHistory: 'Zamknięte miesiące, najnowsze pierwsze, tylko do odczytu.',
    tipLeftoverLog: 'Co każda osoba zrobiła ze swoimi wolnymi środkami po ostatnio zamkniętym miesiącu.',
    tipCloseMonth: 'Zamyka ten miesiąc na zawsze: plan i wydatki zostają zablokowane, a podsumowanie zapisane jako migawka. Nie można tego cofnąć.',
    tipNewMonth: 'Tworzy następny wolny miesiąc, wstępnie wypełniony edytowalnymi wartościami z ostatniego miesiąca. Nic innego nie przechodzi.',
    tipCreateMonth: 'Tworzy bieżący miesiąc, żeby zacząć planowanie.',
    tipNoMonthTitle: 'Nie ma otwartego miesiąca. Miesiące to miesiące kalendarzowe; otwarty może być najwyżej jeden.',
    tipNoMonthText: 'Utwórz bieżący miesiąc, żeby zacząć planować — wypełni się edytowalnymi domyślnymi wartościami z ostatniego miesiąca.',
    tipNoItems: 'Jeszcze nic tu nie ma — użyj przycisku Dodaj, żeby utworzyć pozycję.',
    tipNoExpenses: 'Nie zarejestrowano jeszcze żadnych wydatków — użyj formularza powyżej.',
    tipNothingYet: 'Jeszcze nic tu nie zapisano.',
    tipHistoryEmpty: 'Zamknięte miesiące pojawią się tutaj po ich zamknięciu.',
    tipNoLeftoverMonth: 'Dziennik wolnych środków otworzy się po pierwszym zamkniętym miesiącu.',
    tipOpen: 'Ten miesiąc jest otwarty — plan i wydatki można edytować.',
    tipClosed: 'Ten miesiąc jest zamknięty — tylko do odczytu, poza dziennikiem ostatnio zamkniętego miesiąca.',
    tipBalance: 'Kwota netto do rozliczenia między osobami za wydatki zapłacone osobiście: kto komu płaci przy zamknięciu.',
    tipTransferAfterPayday: 'Udział {name} w kosztach wspólnych w tym miesiącu: część wg pensji w całym planie wspólnym (pozycja z własnym % nadpisuje go dla tej pozycji). Na Twoich liczbach: pensja {salary} z {combined} łącznego dochodu, plan wspólny {plan} → udział {amount}.',
    tipGuaranteedLeft: 'Pieniądze, które {name} zostają w każdym razie: pensja minus udział w kosztach stałych minus wydatki osobiste. Twoje liczby: {salary} − {fixed} − {personal} = {left}.',
    tipPlannedLeft: 'Wolne środki „na pewno” minus zaplanowany udział w zmiennych kosztach wspólnych. Twoje liczby: {prev} − {var} = {left}.',
    tipProjectedLeft: 'Wolne środki, jeśli wydatki zostaną takie jak zarejestrowane: pensja minus udział w stałych minus rzeczywiste wydatki minus osobiste. Twoje liczby: {salary} − {fixed} − {spent} − {personal} = {left}.',
    tipPotBalance: 'Ile zostało z planu wspólnego: koszty stałe zakładamy opłacone automatycznie, wydatki opłacone z planu są z niego pokrywane. Twoje liczby: plan {plan} − stałe {fixed} − wydatki z planu {potpaid} = {balance}. Przy zamknięciu wraca do każdej osoby wg udziału pensji.',
    tipSettleUp: 'Wydatki zapłacone osobiście są przy zamknięciu wyrównywane tak, żeby skończyły się podzielone wg pensji. W tym miesiącu: {from} płaci {to} {amount}.',
    tipOfIncome: 'Udział w kosztach jako % własnej pensji {name}: {amount} z {salary} = {pct}%. Gdy oba procenty są równe, podział jest uczciwy.',
    tipSplitOfPlan: 'Zaplanowany podział planu wspólnego: {a} {ca}% i {b} {cb}% z planu {plan} — wg pensji ({sa} / {sb}), chyba że pozycja ma własny %. Ten pasek mierzy plan, nie to, kto faktycznie zapłacił.',
    tipCoversSpending: 'Z faktycznie wydanych {spent} — kto zapłacił: {a} osobiście {fa}%, {b} osobiście {fb}%, plan wspólny {fp}%. Ten pasek mierzy faktyczne płatności, w przeciwieństwie do paska planu wyżej.',
    tipFairIncome: 'Uczciwie znaczy, że obie osoby przeznaczają taki sam % własnej pensji na koszty wspólne. Teraz: {a} {ia}%, {b} {ib}%.',
    tipEditHint: 'Dziennik wolnych środków można edytować tylko w ostatnio zamkniętym miesiącu.',
    tipReadOnly: 'Starsze zamknięte miesiące są tylko do odczytu.',
    tipMonthClosed: 'Zamknięte miesiące są tylko do odczytu.',
    tipContributions: 'Ile każda osoba dokłada się do wspólnych kosztów w tym miesiącu. Przykład na pierwszym wierszu: {name} — pensja {salary} z {combined} łącznego dochodu, plan wspólny {plan} → {amount}.',
    applyAll: 'Zastosuj wszystkie sugestie ({n})',
    tipApplyAll: 'Akceptuje wszystkie sugestie naraz: każda pozycja auto dostaje sugerowany %, wpisany jako zwykłe edytowalne wartości, które możesz zmienić albo zresetować do auto. Nic nie dzieje się po cichu.',
    suggestionChip: 'Sugerowany podział {a}/{b} — kliknij, aby zaakceptować',
    tipSuggestion: 'Aplikacja sugeruje podział wyrównujący procent pensji obu osób — {a} płacił(a)by {pa}%, a {b} {pb}% tego kosztu. Kliknij, żeby zaakceptować; wpisz własne liczby, żeby zignorować.',
    tipSuggestNotExact: 'Równy % pensji nie jest w pełni osiągalny na pozostałych pozycjach auto — {pa}/{pb} to najbliższy możliwy podział dla {a}/{b}.',
    tipPaid: 'Ile każda osoba zapłaciła osobiście za wspólne wydatki; przy zamknięciu są wyrównywane wg pensji. Przykładowy wiersz: {name} zapłacił(a) osobiście {amount}.',
    tipWhoAreYou: 'Wybierz swój profil — służy tylko do wstępnego wypełniania formularzy i motywu. Oboje możecie edytować wszystko.',
  },
};

const state = {
  profiles: [],
  settings: { currencyCode: 'EUR', language: 'en', categories: [] },
  currentYm: null,
  openMonth: null,
  months: [],
  month: null,
  profileId: Number(localStorage.getItem('honeypot-profile')) || null,
};

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'style') {
      /* CSSOM setProperty, not the style attribute: CSP style-src 'self' blocks inline style attributes. */
      for (const decl of String(v).split(';')) {
        const i = decl.indexOf(':');
        if (i > 0) node.style.setProperty(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
      }
    } else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
};

/* replaceChildren/append stringify raw null/false into visible text — filter them out. */
const kids = (...nodes) => nodes.flat().filter((n) => n != null && n !== false);

/* ---------- delayed tooltip ----------
   The label text itself is the trigger: hover ~2s opens it, keyboard focus and tap open it
   immediately, Escape / focus-out / mouse-leave dismiss it. The tooltip element carries
   role="tooltip" and the associated field references it via aria-describedby. */
const TIP_HOVER_MS = 2000;
let tipSeq = 0;

function initTip(trigger, tip, { toggleOnActivate = true } = {}) {
  let hoverTimer = null;
  let pinned = false;
  const show = () => {
    tip.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  };
  const hide = () => {
    clearTimeout(hoverTimer);
    tip.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    pinned = false;
  };
  trigger.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(show, TIP_HOVER_MS);
  });
  trigger.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    if (!pinned && document.activeElement !== trigger) hide();
  });
  trigger.addEventListener('focus', () => {
    clearTimeout(hoverTimer);
    show();
  });
  trigger.addEventListener('blur', () => {
    if (!pinned) hide();
  });
  if (toggleOnActivate) {
    trigger.addEventListener('click', () => {
      pinned = !pinned;
      if (pinned) show();
      else hide();
    });
  }
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hide();
      e.stopPropagation();
    }
  });
  return { show, hide };
}

/* Label text as a tooltip trigger; returns { node, tipId }. */
function tipWrap(labelKey, tipKey, params) {
  const tipId = `tip-${++tipSeq}`;
  const tip = el('span', { class: 'tooltip', id: tipId, role: 'tooltip', text: t(tipKey, params), hidden: true });
  const trigger = el('span', {
    class: 'tip-trigger',
    tabindex: '0',
    text: t(labelKey, params),
    'aria-expanded': 'false',
    'aria-describedby': tipId,
  });
  initTip(trigger, tip);
  return { node: el('span', { class: 'tip-wrap' }, trigger, tip), tipId };
}

/* Re-localize the tooltip text of an attachTip() target after a language switch. */
function refreshTipText(target) {
  const tip = target.querySelector(':scope > .tooltip');
  if (tip && target.dataset.tipKey) tip.textContent = t(target.dataset.tipKey);
}

/* Attach a tooltip to an existing element (button, badge, select): hover/focus only,
   the element's own click keeps its action. */
function attachTip(target, tipKey, params) {
  const tipId = `tip-${++tipSeq}`;
  const tip = el('span', { class: 'tooltip', id: tipId, role: 'tooltip', text: t(tipKey, params), hidden: true });
  if (!target.hasAttribute('tabindex') && target.tagName !== 'BUTTON' && target.tagName !== 'SELECT' && target.tagName !== 'INPUT') {
    target.setAttribute('tabindex', '0');
  }
  target.setAttribute('aria-expanded', 'false');
  target.setAttribute('aria-describedby', tipId);
  target.classList.add('has-tip');
  target.dataset.tipKey = tipKey;
  initTip(target, tip, { toggleOnActivate: false });
  target.append(tip);
  return tipId;
}

function t(key, params) {
  let str = I18N[state.settings.language]?.[key] ?? I18N.en[key] ?? key;
  for (const [k, v] of Object.entries(params ?? {})) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

/* textContent assignment wipes children — preserve an attached tooltip element. */
function setText(node, text) {
  const tip = node.querySelector(':scope > .tooltip');
  node.textContent = text;
  if (tip) node.append(tip);
}

function applyI18n() {
  document.documentElement.lang = state.settings.language;
  for (const node of document.querySelectorAll('[data-i18n]')) {
    setText(node, t(node.dataset.i18n));
  }
  for (const node of document.querySelectorAll('[data-i18n-aria]')) {
    node.setAttribute('aria-label', t(node.dataset.i18nAria));
  }
  for (const node of document.querySelectorAll('.has-tip[data-tip-key]')) refreshTipText(node);
}

let numberFormatter;
let numberFormatterKey;
function fmtMoney(cents) {
  const key = `${state.settings.language}|${state.settings.currencyCode}`;
  if (numberFormatterKey !== key) {
    numberFormatterKey = key;
    numberFormatter = new Intl.NumberFormat(state.settings.language, {
      style: 'currency',
      currency: state.settings.currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return numberFormatter.format((cents ?? 0) / 100);
}

const dateFormatter = () =>
  new Intl.DateTimeFormat(state.settings.language, { day: 'numeric', month: 'short' });

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return dateFormatter().format(new Date(Date.UTC(y, m - 1, d)));
}

const THEME_PROPS = [
  '--accent', '--accent-ink', '--bg', '--canvas', '--fg', '--ink', '--ink-2', '--ink-3',
  '--line', '--line-2', '--paper', '--surface', '--surface-1', '--surface-2',
];

const PRESET_IDS = ['paper', 'ink', 'sunrise', 'berry', 'ocean', 'contrast'];

const PRESETS = [
  { id: 'paper', key: 'presetPaper', dots: ['#faf6ef', '#ffffff', '#1f5f5b'] },
  { id: 'ink', key: 'presetInk', dots: ['#f2f3f5', '#ffffff', '#b45309'] },
  { id: 'sunrise', key: 'presetSunrise', dots: ['#fdf3ec', '#fffaf6', '#c2410c'] },
  { id: 'berry', key: 'presetBerry', dots: ['#fbf5f7', '#ffffff', '#9d174d'] },
  { id: 'ocean', key: 'presetOcean', dots: ['#eef6fa', '#ffffff', '#0369a1'] },
  { id: 'contrast', key: 'presetContrast', dots: ['#ffffff', '#f2f2f2', '#0b3d91'] },
];

function applyTheme(profile) {
  const root = document.documentElement;
  for (const prop of THEME_PROPS) root.style.removeProperty(prop);
  const preset = PRESET_IDS.includes(profile?.theme?.preset) ? profile.theme.preset : 'paper';
  root.dataset.theme = preset;
  root.dataset.mode = profile?.theme?.mode === 'dark' ? 'dark' : 'light';
}

async function withBusy(btn, fn) {
  if (!btn) return fn();
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  try {
    return await fn();
  } finally {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
  }
}

function currentProfile() {
  return state.profiles.find((p) => p.id === state.profileId) ?? null;
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code ? `err_${data.code}` : null;
    const localized = code && (I18N[state.settings.language]?.[code] ?? I18N.en[code]);
    throw new Error(localized || data.error || `${method} ${path} failed`);
  }
  return data;
}

function showProfilePick() {
  const box = $('#pick-buttons');
  box.replaceChildren();
  for (const p of state.profiles) {
    box.append(
      el('button', {
        type: 'button',
        class: 'btn btn-primary',
        text: p.name,
        onclick: () => {
          setProfile(p.id);
          $('#dlg-pick').close();
        },
      })
    );
  }
  $('#dlg-pick').showModal();
}

function setProfile(id) {
  state.profileId = id;
  localStorage.setItem('honeypot-profile', String(id));
  renderHeader();
  applyTheme(currentProfile());
}

function renderHeader() {
  const switchEl = $('#profile-switch');
  switchEl.replaceChildren();
  for (const p of state.profiles) {
    switchEl.append(el('option', { value: p.id, text: p.name }));
  }
  if (state.profileId) switchEl.value = String(state.profileId);
  $('#name-a').textContent = state.profiles[0]?.name ?? 'Partner A';
  $('#name-b').textContent = state.profiles[1]?.name ?? 'Partner B';
  const status = $('#month-status');
  const month = state.month ?? state.openMonth;
  if (month) {
    status.hidden = false;
    setText(status, month.status === 'open' ? t('open') : t('closed'));
    status.dataset.tipKey = month.status === 'open' ? 'tipOpen' : 'tipClosed';
    refreshTipText(status);
  } else {
    status.hidden = true;
  }
  const balance = $('#balance-badge');
  const settle = state.month?.summary?.settle ?? null;
  const offset = settle ? Math.abs(settle.A) : 0;
  if (state.month && settle && offset !== 0) {
    balance.hidden = false;
    setText(balance, `${t('balance')} ${fmtMoney(offset)}`);
  } else {
    balance.hidden = true;
  }
  const newMonthBtn = $('#btn-new-month');
  if (newMonthBtn) newMonthBtn.disabled = state.openMonth != null;
}

async function refreshState() {
  const s = await api('GET', '/api/state');
  state.profiles = s.profiles;
  state.settings = s.settings;
  state.currentYm = s.currentYm;
  state.openMonth = s.openMonth;
  state.mostRecentClosedYm = s.mostRecentClosedYm ?? null;
  applyI18n();
  renderHeader();
  if (!state.profileId || !state.profiles.some((p) => p.id === state.profileId)) {
    showProfilePick();
  } else {
    applyTheme(currentProfile());
  }
}

state.mostRecentClosedYm = null;

/* ---------- month view ---------- */

function parseMoney(str) {
  return parseFlexibleMoney(str);
}

/* Spinner-free numeric field: plain text input, live filtering on every keystroke/paste,
   blur snaps money to 2 decimals. The draft only ever receives parsed integer cents. */
function moneyInput(cents, oninput, { disabled = false, aria } = {}) {
  return el('input', {
    type: 'text',
    inputmode: 'decimal',
    class: 'num-input',
    'aria-label': aria ?? t('amount'),
    value: formatMoneyInput(cents),
    disabled,
    oninput: (e) => {
      const clean = sanitizeNumericInput(e.target.value, { decimal: true });
      if (clean !== e.target.value) e.target.value = clean;
      oninput(parseFlexibleMoney(clean));
    },
    onblur: (e) => {
      const v = parseFlexibleMoney(e.target.value);
      e.target.value = formatMoneyInput(v);
      oninput(v);
    },
  });
}

function textInput(value, oninput, { disabled = false, aria } = {}) {
  return el('input', {
    type: 'text',
    value: value ?? '',
    'aria-label': aria ?? t('label'),
    disabled,
    oninput: (e) => oninput(e.target.value),
  });
}

let toastTimer;
function notify(kind, message) {
  const toast = $('#toast');
  if (!toast) return alert(message);
  toast.dataset.kind = kind;
  toast.textContent = message;
  toast.title = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

function notifyError(err) {
  notify('error', err.message);
}

function cloneDraft(month) {
  return {
    salaries: { 1: month.salaries['1'] ?? 0, 2: month.salaries['2'] ?? 0 },
    items: month.items.map((i) => ({ ...i })),
  };
}

function renderMonthOptions() {
  const select = $('#month-switch');
  const current = select.value;
  select.replaceChildren(...kids(
    ...state.months.map((m) => el('option', { value: m.ym, text: `${m.ym} (${t(m.status)})` })),
    state.months.length ? null : el('option', { value: '', text: t('noMonthsYet'), disabled: true })
  ));
  if (current && [...select.options].some((o) => o.value === current)) select.value = current;
}

async function loadMonths() {
  const { months } = await api('GET', '/api/months');
  state.months = months;
  renderMonthOptions();
  const select = $('#month-switch');
  const target = state.openMonth?.ym ?? null;
  if (target && months.some((m) => m.ym === target)) {
    select.value = target;
    await loadMonth(target);
  } else {
    if (months.length) select.value = months[0].ym;
    state.month = null;
    renderMonth();
  }
}

function nextYm(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function createMonth() {
  const taken = new Set(state.months.map((m) => m.ym));
  let ym = state.currentYm;
  while (taken.has(ym)) ym = nextYm(ym);
  state.month = await api('POST', '/api/months', { ym });
  await refreshState();
  await loadMonths();
}

async function loadMonth(ym) {
  state.month = await api('GET', `/api/months/${ym}`);
  state.draft = cloneDraft(state.month);
  renderMonth();
}

function editable() {
  return state.month?.status === 'open';
}

function renderMonth() {
  const month = state.month;
  const missing = $('#month-missing');
  const body = $('#month-body');
  if (!month) {
    missing.hidden = false;
    body.hidden = true;
    $('#btn-create-month').disabled = state.openMonth != null;
    $('#btn-close-month').disabled = true;
    renderHeader();
    return;
  }
  missing.hidden = true;
  body.hidden = false;
  renderHeader();
  renderPlan();
  renderFigures();
  renderExpenses();
  renderPersonal(1, $('#personal-list-a'));
  renderPersonal(2, $('#personal-list-b'));
  $('#btn-close-month').disabled = !editable();
}

function clampPct(v) {
  return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
}

function pctInput({ value, placeholder, aria, side, disabled, oninput }) {
  return el('input', {
    type: 'text',
    inputmode: 'numeric',
    class: 'num-input',
    placeholder: placeholder || undefined,
    'aria-label': aria,
    'data-side': side,
    value,
    disabled,
    oninput: (e) => {
      const clean = sanitizeNumericInput(e.target.value, { decimal: false });
      if (clean !== e.target.value) e.target.value = clean;
      oninput(e);
    },
    onblur: (e) => {
      e.target.value = formatPctInput(e.target.value);
      oninput(e);
    },
  });
}

function itemCard(item, idx, kind, owner) {
  const canEdit = editable();
  const nameA = state.profiles[0]?.name ?? 'A';
  const nameB = state.profiles[1]?.name ?? 'B';
  const removeBtn = el('button', {
    type: 'button',
    class: 'btn btn-danger',
    text: t('remove'),
    disabled: !canEdit,
    onclick: () => showConfirm(t('confirmDelete'), () => {
      state.draft.items.splice(idx, 1);
      renderPlan();
      renderPersonal(1, $('#personal-list-a'));
      renderPersonal(2, $('#personal-list-b'));
      scheduleAutosave();
    }),
  });
  const row1 = el('div', { class: 'personal-row' },
    textInput(item.label, (v) => { item.label = v; scheduleAutosave(); }, { disabled: !canEdit }),
    moneyInput(item.amountCents, (v) => { item.amountCents = v; scheduleAutosave(); }, { disabled: !canEdit }));

  let row2;
  if (kind === 'personal') {
    const partnerName = owner === 1 ? nameB : nameA;
    const pctCtl = pctInput({
      value: item.partnerSharePct >= 0 ? String(item.partnerSharePct) : '',
      aria: t('partnerShare', { name: partnerName }),
      side: 'partner',
      disabled: !canEdit,
      oninput: (e) => {
        const v = e.target.value;
        item.partnerSharePct = v === '' ? -1 : clampPct(v);
        scheduleAutosave();
      },
    });
    const tw = tipWrap('partnerShare', 'tipPartnerShare', { name: partnerName });
    tw.node.classList.add('field-label');
    pctCtl.setAttribute('aria-describedby', tw.tipId);
    row2 = el('div', { class: 'personal-row' },
      el('label', { class: 'personal-pct' }, tw.node, pctCtl),
      removeBtn);
  } else {
    const pct = item.partnerSharePct ?? -1;
    const sA = state.draft.salaries[1] ?? 0;
    const sB = state.draft.salaries[2] ?? 0;
    const total = sA + sB;
    const autoA = total > 0 ? String(Math.round((sA / total) * 100)) : '';
    const autoB = total > 0 ? String(100 - Math.round((sA / total) * 100)) : '';
    const aInput = pctInput({
      value: pct >= 0 ? String(100 - pct) : '',
      placeholder: autoA,
      aria: `${nameA} %`,
      side: 'a',
      disabled: !canEdit,
      oninput: (e) => {
        const v = e.target.value;
        if (v === '') {
          item.partnerSharePct = -1;
          aInput.value = '';
          bInput.value = '';
        } else {
          const av = clampPct(v);
          item.partnerSharePct = 100 - av;
          aInput.value = String(av);
          bInput.value = String(100 - av);
        }
        scheduleAutosave();
      },
    });
    const bInput = pctInput({
      value: pct >= 0 ? String(pct) : '',
      placeholder: autoB,
      aria: `${nameB} %`,
      side: 'b',
      disabled: !canEdit,
      oninput: (e) => {
        const v = e.target.value;
        if (v === '') {
          item.partnerSharePct = -1;
          aInput.value = '';
          bInput.value = '';
        } else {
          const bv = clampPct(v);
          item.partnerSharePct = bv;
          bInput.value = String(bv);
          aInput.value = String(100 - bv);
        }
        scheduleAutosave();
      },
    });
    const autoBtn = el('button', {
      type: 'button',
      class: 'btn btn-mini',
      text: t('auto'),
      disabled: !canEdit,
      onclick: () => {
        item.partnerSharePct = -1;
        aInput.value = '';
        bInput.value = '';
        scheduleAutosave();
      },
    });
    /* fair-share suggestion chip on auto items (eligible only); one-click apply */
    let sugChip = null;
    if (pct < 0 && canEdit) {
      const sug = suggestFairSplit(state.draft.items, sA, sB);
      const mine = sug.suggestions.find((x) => x.item === item);
      if (mine) {
        const pctA = 100 - mine.pctB;
        sugChip = el('button', {
          type: 'button',
          class: 'btn btn-mini sug-chip',
          text: `${pctA}/${mine.pctB}`,
          'aria-label': t('suggestionChip', { a: pctA, b: mine.pctB }),
          'data-idx': String(idx),
          onclick: () => {
            item.partnerSharePct = mine.pctB;
            aInput.value = String(pctA);
            bInput.value = String(mine.pctB);
            renderPlan();
            renderPersonal(1, $('#personal-list-a'));
            renderPersonal(2, $('#personal-list-b'));
            scheduleAutosave();
          },
        });
        attachTip(sugChip, sug.clamped ? 'tipSuggestNotExact' : 'tipSuggestion', { a: nameA, b: nameB, pa: pctA, pb: mine.pctB });
      }
    }
    const splitTip = tipWrap('splitLabel', 'tipSplitLabel', { a: nameA, b: nameB });
    splitTip.node.classList.add('field-label');
    aInput.setAttribute('aria-describedby', splitTip.tipId);
    bInput.setAttribute('aria-describedby', splitTip.tipId);
    row2 = el('div', { class: 'personal-row split-row' },
      splitTip.node,
      aInput,
      el('span', { class: 'split-sep', text: '/' }),
      bInput,
      ...kids(sugChip),
      autoBtn,
      removeBtn);
  }
  return el('div', { class: 'personal-item', role: 'group', 'aria-label': item.label.trim() || t('newItem') }, row1, row2);
}

function planItemsOf(kind, owner) {
  return state.draft.items
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) =>
      kind === 'personal' ? item.kind === 'personal' && item.ownerProfileId === owner : item.kind === kind
    );
}

function itemTable(headCells, rows, closedText, emptyText) {
  const table = el('table', {});
  const headRow = el('tr', {}, ...headCells.map((h) => el('th', {}, h)));
  table.append(el('thead', {}, headRow), el('tbody', {}, ...rows));
  const wrap = el('div', { class: 'table-wrap' });
  wrap.append(table);
  if (!rows.length) {
    wrap.append(el('p', { class: 'empty-row' }, emptyText ?? tipWrap('noItems', 'tipNoItems').node));
  }
  if (closedText) {
    wrap.append(el('p', { class: 'empty-row', text: closedText }));
  }
  return wrap;
}

function addItem(kind, owner) {
  const item = { kind, label: '', amountCents: 0 };
  if (kind === 'personal') {
    item.ownerProfileId = owner;
    item.partnerSharePct = 0;
  }
  state.draft.items.push(item);
  renderPlan();
  renderPersonal(1, $('#personal-list-a'));
  renderPersonal(2, $('#personal-list-b'));
}

function field(labelKey, control, tipKey, tipParams) {
  const tw = tipWrap(labelKey, tipKey, tipParams);
  tw.node.classList.add('field-label');
  if (control && control.setAttribute) control.setAttribute('aria-describedby', tw.tipId);
  return el('label', { class: 'field' }, tw.node, control);
}

function renderPlan() {
  const canEdit = editable();
  const box = $('#plan-salaries');
  box.replaceChildren(
    el('h3', {}, tipWrap('salaries', 'tipSalaries').node),
    el('div', { class: 'form-grid' },
      ...[1, 2].map((pid) =>
        field('salaryFor',
          moneyInput(state.draft.salaries[pid], (v) => { state.draft.salaries[pid] = v; scheduleAutosave(); }, { disabled: !canEdit }),
          'tipSalaryFor', { name: state.profiles.find((p) => p.id === pid)?.name ?? pid })
      ),
      el('span', { class: 'hint save-state', id: 'plan-save-state' })
    ),
    (() => {
      const h = el('p', { class: 'hint', id: 'plan-share-hint', text: shareHint() });
      const s = liveSummary();
      const na = state.profiles[0]?.name ?? 'A';
      const nb = state.profiles[1]?.name ?? 'B';
      const ia = s && s.salaries.A > 0 ? pctStr(pct(s.contributions.A, s.salaries.A)) : t('none');
      const ib = s && s.salaries.B > 0 ? pctStr(pct(s.contributions.B, s.salaries.B)) : t('none');
      attachTip(h, 'tipFairIncome', { a: na, b: nb, ia, ib });
      return h;
    })(),
    (() => {
      const b = el('button', {
        type: 'button',
        class: 'btn',
        id: 'btn-apply-suggestions',
        text: t('applyAll', { n: 0 }),
        hidden: true,
        onclick: () => {
          const sug = suggestFairSplit(state.draft.items, state.draft.salaries[1] ?? 0, state.draft.salaries[2] ?? 0);
          for (const x of sug.suggestions) x.item.partnerSharePct = x.pctB;
          renderPlan();
          renderPersonal(1, $('#personal-list-a'));
          renderPersonal(2, $('#personal-list-b'));
          scheduleAutosave();
        },
      });
      attachTip(b, 'tipApplyAll');
      return b;
    })()
  );
  updateSuggestions();

  const nameA = state.profiles[0]?.name ?? 'A';
  const nameB = state.profiles[1]?.name ?? 'B';
  for (const kind of ['fixed', 'variable']) {
    const box = $(`#plan-${kind}`);
    const rows = planItemsOf(kind);
    box.replaceChildren(...kids(
      el('h3', {}, tipWrap(kind === 'fixed' ? 'fixedShared' : 'variableShared', kind === 'fixed' ? 'tipFixedShared' : 'tipVariableShared').node),
      el('p', { class: 'hint', text: t('splitHint', { a: nameA, b: nameB }) }),
      ...rows.map(({ item, idx }) => itemCard(item, idx, kind)),
      rows.length ? null : el('p', { class: 'empty-row' }, tipWrap('noItems', 'tipNoItems').node),
      canEdit
        ? el('button', { type: 'button', class: 'btn', text: t('add'), onclick: () => addItem(kind) })
        : el('p', { class: 'hint' }, tipWrap('monthClosed', 'tipMonthClosed').node)
    ));
  }
}

function liveSummary() {
  if (!state.month) return null;
  if (!state.draft) return state.month.summary;
  return computeSummary({
    salaryA: state.draft.salaries[1] ?? 0,
    salaryB: state.draft.salaries[2] ?? 0,
    items: state.draft.items,
    expenses: state.month.expenses,
  });
}

/* Recompute fair-share suggestion chips + the apply-all button live on every draft change. */
function updateSuggestions() {
  if (!state.month || !state.draft) return;
  const sA = state.draft.salaries[1] ?? 0;
  const sB = state.draft.salaries[2] ?? 0;
  const sug = suggestFairSplit(state.draft.items, sA, sB);
  const nameA = state.profiles[0]?.name ?? 'A';
  const nameB = state.profiles[1]?.name ?? 'B';
  for (const chip of document.querySelectorAll('.sug-chip')) {
    const item = state.draft.items[Number(chip.dataset.idx)];
    const mine = item && sug.suggestions.find((x) => x.item === item);
    if (!mine || !editable()) {
      chip.hidden = true;
      continue;
    }
    chip.hidden = false;
    const pctA = 100 - mine.pctB;
    setText(chip, `${pctA}/${mine.pctB}`);
    chip.setAttribute('aria-label', t('suggestionChip', { a: pctA, b: mine.pctB }));
    const key = sug.clamped ? 'tipSuggestNotExact' : 'tipSuggestion';
    chip.dataset.tipKey = key;
    const tip = chip.querySelector(':scope > .tooltip');
    if (tip) tip.textContent = t(key, { a: nameA, b: nameB, pa: pctA, pb: mine.pctB });
  }
  const btn = document.getElementById('btn-apply-suggestions');
  if (btn) {
    const n = editable() ? sug.suggestions.length : 0;
    btn.hidden = n === 0;
    setText(btn, t('applyAll', { n }));
  }
}

function updateDerived() {
  if (!state.month) return;
  const hint = document.getElementById('plan-share-hint');
  if (hint) setText(hint, shareHint());
  updateSuggestions();
  renderFigures();
}

let autosaveTimer = null;

async function flushAutosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
    await autosave();
  }
}

function setSaveState(text) {
  for (const n of document.querySelectorAll('.save-state')) {
    n.textContent = text;
    n.hidden = !text;
  }
}

function scheduleAutosave() {
  updateDerived();
  if (!state.month || !editable()) return;
  setSaveState(t('saving'));
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(autosave, 700);
}

async function autosave() {
  if (!state.month || !editable()) return;
  const all = state.draft.items;
  const items = all
    .filter((i) => i.label.trim() && i.amountCents > 0)
    .map((i) => ({
      id: i.id ?? null,
      kind: i.kind,
      label: i.label,
      amountCents: i.amountCents,
      ownerProfileId: i.ownerProfileId,
      partnerSharePct: i.partnerSharePct ?? -1,
    }));
  try {
    state.month = await api('PUT', `/api/months/${state.month.ym}/plan`, {
      salaries: state.draft.salaries,
      items,
    });
    setSaveState(items.length === all.length ? t('saved') : t('savedSkipped', { n: all.length - items.length }));
  } catch (err) {
    setSaveState(t('error'));
    notifyError(err);
  }
}

function renderPersonal(owner, box) {
  const canEdit = editable();
  const rows = planItemsOf('personal', owner);
  box.replaceChildren(...kids(
    ...rows.map(({ item, idx }) => itemCard(item, idx, 'personal', owner)),
    rows.length ? null : el('p', { class: 'empty-row' }, tipWrap('noItems', 'tipNoItems').node),
    !canEdit && state.month ? el('p', { class: 'empty-row' }, tipWrap('monthClosed', 'tipMonthClosed').node) : null,
    canEdit
      ? el('button', { type: 'button', class: 'btn', text: t('add'), onclick: () => addItem('personal', owner) })
      : null
  ));
}

/* ---------- live figures (US3) ---------- */

function fig(captionKey, value, tipKey, tipParams) {
  const tw = tipWrap(captionKey, tipKey, tipParams);
  const val = el('span', { class: 'money', text: value });
  val.setAttribute('aria-describedby', tw.tipId);
  return el('figure', { class: 'fig' }, el('figcaption', {}, tw.node), val);
}

function pct(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

const CATEGORY_COLORS = ['#2e7d32', '#b26a00', '#6a4fb3', '#0b6fa4', '#a63d2f', '#1f5f5b', '#8a6d00', '#595959'];

function colorForCategory(name) {
  let h = 0;
  for (const ch of name ?? '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[h % CATEGORY_COLORS.length];
}

function splitBar(segments, label) {
  const bar = el('div', { class: 'split-bar', role: 'img', 'aria-label': label });
  for (const [cls, w] of segments) {
    if (w > 0) bar.append(el('span', { class: `seg ${cls}`, style: `width:${w}%` }));
  }
  return bar;
}

function legendItem(cls, text) {
  return el('span', { class: 'legend-item' }, el('i', { class: `dot ${cls}`, 'aria-hidden': 'true' }), text);
}

function figRow(labelKey, value, tipKey, tipParams) {
  const tw = tipWrap(labelKey, tipKey, tipParams);
  tw.node.classList.add('fig-label');
  const val = el('span', { class: 'money', text: value });
  val.setAttribute('aria-describedby', tw.tipId);
  return el('div', { class: 'fig-row' }, tw.node, val);
}

function shareHint() {
  const s = liveSummary();
  if (!s) return t('noItems');
  const nameA = state.profiles[0]?.name ?? 'A';
  const nameB = state.profiles[1]?.name ?? 'B';
  const cA = pct(s.contributions.A, s.sharedPlannedTotal);
  const cB = pct(s.contributions.B, s.sharedPlannedTotal);
  const iA = s.salaries.A > 0 ? pct(s.contributions.A, s.salaries.A) : null;
  const iB = s.salaries.B > 0 ? pct(s.contributions.B, s.salaries.B) : null;
  const fair = iA != null && iB != null && Math.abs(iA - iB) < 0.05;
  return `${nameA} ${cA}% · ${nameB} ${cB}% ${t('ofPlan')} — ${fair && iA != null ? t('fairIncome', { pct: iA }) : `${nameA} ${pctStr(iA)} · ${nameB} ${pctStr(iB)}`}`;
}

function pctStr(v) {
  return v == null ? t('none') : `${v}%`;
}

/* Live worked-example params for the figure tooltips (Change 4: explanations use the
   current numbers, not generic text). */
function figTipParams(s, p, names) {
  return {
    name: names[p],
    salary: fmtMoney(s.salaries[p]),
    combined: fmtMoney(s.combinedIncome),
    plan: fmtMoney(s.sharedPlannedTotal),
    amount: fmtMoney(s.contributions[p]),
    pct: `${pct(s.contributions[p], s.salaries[p])}%`,
    fixed: fmtMoney(s.fixedShare[p]),
    personal: fmtMoney(s.personalOut[p]),
    prev: fmtMoney(s.guaranteedLeft[p]),
    var: fmtMoney(s.variableShare[p]),
    spent: fmtMoney(s.actualSpent),
  };
}

function renderFigures() {
  const s = liveSummary();
  const box = $('#figures');
  const names = { A: state.profiles[0]?.name ?? 'A', B: state.profiles[1]?.name ?? 'B' };
  box.replaceChildren();

  const cA = pct(s.contributions.A, s.sharedPlannedTotal);
  const cB = pct(s.contributions.B, s.sharedPlannedTotal);
  const iA = s.salaries.A > 0 ? pct(s.contributions.A, s.salaries.A) : null;
  const iB = s.salaries.B > 0 ? pct(s.contributions.B, s.salaries.B) : null;
  const fair = iA != null && iB != null && Math.abs(iA - iB) < 0.05;
  const fairHint = el('p', { class: 'hint', text: fair && iA != null ? t('fairIncome', { pct: iA }) : `${names.A} ${pctStr(iA)} · ${names.B} ${pctStr(iB)}` });
  attachTip(fairHint, 'tipFairIncome', { a: names.A, b: names.B, ia: pctStr(iA), ib: pctStr(iB) });
  const planBlock = el('div', { class: 'split-block' },
    el('div', { class: 'block-head' },
      el('h3', {}, tipWrap('splitOfPlan', 'tipSplitOfPlan', {
        a: names.A, b: names.B, ca: `${cA}`, cb: `${cB}`,
        plan: fmtMoney(s.sharedPlannedTotal), sa: fmtMoney(s.salaries.A), sb: fmtMoney(s.salaries.B),
      }).node)),
    splitBar([['seg-a', cA], ['seg-b', cB]], `${names.A} ${cA}%, ${names.B} ${cB}%`),
    el('p', { class: 'split-legend' },
      legendItem('seg-a', `${names.A} — ${cA}%`),
      legendItem('seg-b', `${names.B} — ${cB}%`)),
    el('div', { class: 'block-head' }, fairHint)
  );

  const potPaid = s.actualSpent - s.fronted.A - s.fronted.B;
  const fA = pct(s.fronted.A, s.actualSpent);
  const fB = pct(s.fronted.B, s.actualSpent);
  const fPot = pct(potPaid, s.actualSpent);
  const covBlock = el('div', { class: 'split-block' },
    el('div', { class: 'block-head' },
      el('h3', {}, tipWrap('coversSpending', 'tipCoversSpending', {
        spent: fmtMoney(s.actualSpent), a: names.A, b: names.B, fa: `${fA}`, fb: `${fB}`, fp: `${fPot}`,
      }).node),
      el('span', { class: 'money', text: fmtMoney(s.actualSpent) })),
    splitBar([['seg-a', fA], ['seg-b', fB], ['seg-pot', fPot]], `${names.A} ${fA}%, ${names.B} ${fB}%, ${t('pot')} ${fPot}%`),
    el('p', { class: 'split-legend' },
      legendItem('seg-a', `${names.A} ${fA}%`),
      legendItem('seg-b', `${names.B} ${fB}%`),
      legendItem('seg-pot', `${t('pot')} ${fPot}%`))
  );

  const cols = el('div', { class: 'partner-cols' },
    ...['A', 'B'].map((p) => {
      const bp = figTipParams(s, p, names);
      return el('section', { class: 'partner-col' },
        el('h3', { class: p === 'A' ? 'who-a' : 'who-b', text: `${names[p]} — ${p === 'A' ? cA : cB}% ${t('ofPlan')}` }),
        figRow('transferAfterPayday', fmtMoney(s.contributions[p]), 'tipTransferAfterPayday', bp),
        figRow('ofIncome', pctStr(p === 'A' ? iA : iB), 'tipOfIncome', bp),
        figRow('guaranteedLeft', fmtMoney(s.guaranteedLeft[p]), 'tipGuaranteedLeft', { ...bp, left: fmtMoney(s.guaranteedLeft[p]) }),
        figRow('plannedLeft', fmtMoney(s.plannedLeft[p]), 'tipPlannedLeft', { ...bp, left: fmtMoney(s.plannedLeft[p]) }),
        figRow('projectedLeft', fmtMoney(s.projectedLeft[p]), 'tipProjectedLeft', { ...bp, left: fmtMoney(s.projectedLeft[p]) })
      );
    })
  );

  let settleLine = figRow('settleUp', t('none'), 'tipSettleUp', { from: '—', to: '—', amount: '—' });
  if (s.settle && (s.settle.A !== 0 || s.settle.B !== 0)) {
    const [p, other] = s.settle.A > 0 ? ['A', 'B'] : ['B', 'A'];
    const amount = fmtMoney(Math.abs(s.settle[p]));
    settleLine = figRow('settleUp', t('settleLine', { from: names[other], to: names[p], amount }), 'tipSettleUp', { from: names[other], to: names[p], amount });
  }
  box.append(
    planBlock,
    covBlock,
    cols,
    el('div', { class: 'split-block' },
      figRow('potBalance', fmtMoney(s.potBalance), 'tipPotBalance', {
        plan: fmtMoney(s.sharedPlannedTotal), fixed: fmtMoney(s.fixedTotal),
        potpaid: fmtMoney(s.actualSpent - s.fronted.A - s.fronted.B), balance: fmtMoney(s.potBalance),
      }),
      settleLine
    )
  );
}

/* ---------- spending log (US4) ---------- */

let editingExpenseId = null;

function renderExpenses() {
  const s = liveSummary() ?? state.month.summary;
  const canEdit = editable();
  const form = $('#expense-form');
  form.replaceChildren();
  if (canEdit) {
    const [yr, mo] = state.month.ym.split('-').map(Number);
    const lastDay = new Date(Date.UTC(yr, mo, 0)).getUTCDate();
    const lastD2 = String(lastDay).padStart(2, '0');
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const defDate = todayIso >= `${state.month.ym}-01` && todayIso <= `${state.month.ym}-${lastD2}` ? todayIso : `${state.month.ym}-01`;
    const editing = state.month.expenses.find((x) => x.id === editingExpenseId) ?? null;
    const dateInput = el('input', { id: 'ef-date', type: 'date', value: editing?.date ?? defDate, min: `${state.month.ym}-01`, max: `${state.month.ym}-${lastD2}`, 'aria-label': t('date') });
    const descInput = el('input', { id: 'ef-desc', type: 'text', placeholder: t('description'), 'aria-label': t('description'), value: editing?.description ?? '' });
    const amountInput = el('input', { id: 'ef-amount', type: 'text', inputmode: 'decimal', class: 'num-input', placeholder: t('amount'), 'aria-label': t('amount'), value: editing ? formatMoneyInput(editing.amountCents) : '' });
    amountInput.addEventListener('input', (e) => {
      const clean = sanitizeNumericInput(e.target.value, { decimal: true });
      if (clean !== e.target.value) e.target.value = clean;
    });
    amountInput.addEventListener('blur', (e) => {
      e.target.value = formatMoneyInput(parseFlexibleMoney(e.target.value));
    });
    const itemSelect = el('select', { id: 'ef-item' },
      el('option', { value: '', text: `${t('linkItem')}: ${t('unplanned')}` }),
      ...state.month.items
        .filter((i) => i.kind === 'variable')
        .map((i) => el('option', { value: i.id, text: i.label }))
    );
    const payerSelect = el('select', { id: 'ef-payer' },
      el('option', { value: '', text: `${t('payer')}: ${t('potPaid')}` }),
      ...state.profiles.map((p) => el('option', { value: p.id, text: p.name }))
    );
    const categorySelect = el('select', { id: 'ef-category' },
      ...state.settings.categories.map((c) => el('option', { value: c, text: c }))
    );
    if (editing) {
      itemSelect.value = editing.planItemId != null ? String(editing.planItemId) : '';
      payerSelect.value = editing.payerProfileId != null ? String(editing.payerProfileId) : '';
      categorySelect.value = editing.category ?? '';
    }
    const submit = async () => {
      const payload = {
        date: dateInput.value,
        category: categorySelect.value,
        description: descInput.value,
        amountCents: parseMoney(amountInput.value),
        planItemId: itemSelect.value ? Number(itemSelect.value) : null,
        payerProfileId: payerSelect.value ? Number(payerSelect.value) : null,
      };
      try {
        if (editingExpenseId) {
          state.month = await api('PUT', `/api/expenses/${editingExpenseId}`, payload);
        } else {
          state.month = await api('POST', `/api/months/${state.month.ym}/expenses`, payload);
        }
        const keep = { 'ef-date': dateInput.value, 'ef-category': categorySelect.value, 'ef-payer': payerSelect.value, 'ef-item': itemSelect.value };
        editingExpenseId = null;
        renderMonth();
        for (const [id, v] of Object.entries(keep)) {
          const n = document.getElementById(id);
          if (n && (n.tagName !== 'SELECT' || [...n.options].some((o) => o.value === v))) n.value = v;
        }
      } catch (err) {
        notifyError(err);
      }
    };
    form.append(
      el('div', { class: 'form-grid' },
        field('date', dateInput, 'tipDate'),
        field('category', categorySelect, 'tipCategory'),
        field('description', descInput, 'tipDescription'),
        field('amount', amountInput, 'tipAmount'),
        field('linkItem', itemSelect, 'tipLinkItem'),
        field('payer', payerSelect, 'tipPayer'),
        el('button', {
          type: 'button',
          class: 'btn btn-primary',
          text: editing ? t('save') : t('addExpense'),
          onclick: (e) => withBusy(e.currentTarget, submit),
        }),
        editing
          ? el('button', { type: 'button', class: 'btn', text: t('cancel'), onclick: () => { editingExpenseId = null; renderExpenses(); } })
          : null
      )
    );
  }

  const totals = { A: 0, B: 0, pot: 0 };
  for (const e of state.month.expenses) {
    if (e.payerProfileId === 1) totals.A += e.amountCents;
    else if (e.payerProfileId === 2) totals.B += e.amountCents;
    else totals.pot += e.amountCents;
  }
  const strip = el('div', { class: 'paid-strip' },
    el('span', { class: 'paid-chip' },
      el('span', { text: t('paidByStrip', { name: state.profiles[0]?.name ?? 'A' }) }),
      el('span', { class: 'money', text: fmtMoney(totals.A) })),
    el('span', { class: 'paid-chip' },
      el('span', { text: t('paidByStrip', { name: state.profiles[1]?.name ?? 'B' }) }),
      el('span', { class: 'money', text: fmtMoney(totals.B) })),
    el('span', { class: 'paid-chip' },
      el('span', { text: t('pot') }),
      el('span', { class: 'money', text: fmtMoney(totals.pot) }))
  );

  const list = $('#expense-list');
  list.replaceChildren(
    strip,
    itemTable(
      [t('date'), t('category'), t('description'), t('amount'), t('linkItem'), t('payer'), ''],
      state.month.expenses.map((e) => {
        const linked = state.month.items.find((i) => i.id === e.planItemId);
        const payer = state.profiles.find((p) => p.id === e.payerProfileId);
        return el('tr', {},
          el('td', { text: fmtDate(e.date) }),
          el('td', {}, el('span', { class: 'cat-chip' },
            el('i', { class: 'cat-dot', style: `background:${colorForCategory(e.category)}`, 'aria-hidden': 'true' }),
            e.category || t('none'))),
          el('td', { text: e.description }),
          el('td', { class: 'num money', text: fmtMoney(e.amountCents) }),
          el('td', { text: linked?.label ?? t('unplanned') }),
          el('td', { text: payer?.name ?? t('potPaid') }),
          el('td', {}, ...kids(
            canEdit
              ? el('button', {
                  type: 'button',
                  class: 'btn btn-mini',
                  text: t('edit'),
                  onclick: () => { editingExpenseId = e.id; renderExpenses(); },
                })
              : null,
            canEdit
              ? el('button', {
                  type: 'button',
                  class: 'btn btn-danger',
                  text: t('remove'),
                  onclick: () => showConfirm(t('confirmDelete'), async () => {
                    try {
                      state.month = await api('DELETE', `/api/expenses/${e.id}`);
                      renderMonth();
                    } catch (err) {
                      notifyError(err);
                    }
                  }),
                })
              : null
          ))
        );
      }), null, tipWrap('noExpenses', 'tipNoExpenses').node
    ),
    el('h3', { text: `${t('planned')} / ${t('actual')}` }),
    itemTable(
      [t('label'), t('planned'), t('actual'), t('unplanned')],
      [
        ...s.planVsActual.map((i) =>
          el('tr', {},
            el('td', { text: i.label }),
            el('td', { class: 'num money', text: fmtMoney(i.planned) }),
            el('td', { class: 'num money', text: fmtMoney(i.actual) }),
            el('td', {})
          )
        ),
        el('tr', {},
          el('td', { text: t('unplanned') }),
          el('td', {}),
          el('td', { class: 'num money', text: fmtMoney(s.unplannedTotal) }),
          el('td', {})
        ),
      ]
    )
  );
}

/* ---------- month close (US5) ---------- */

function renderSummaryBody(box, snapshot, month) {
  const names = { A: state.profiles[0]?.name, B: state.profiles[1]?.name };
  const s = snapshot;
  const pa = figTipParams(s, 'A', names); /* worked example uses the first row's numbers */
  const rows = [];
  for (const p of ['A', 'B']) {
    rows.push(el('tr', {},
      el('td', { text: names[p] }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.contributions[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.fronted[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.guaranteedLeft[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.plannedLeft[p]) }),
      el('td', { class: 'num money', text: fmtMoney(snapshot.projectedLeft[p]) })
    ));
  }
  const parts = [
    el('h3', {}, tipWrap('contributions', 'tipContributions').node, ` — ${month.ym}`),
    itemTable(
      [tipWrap('label', 'tipLabel').node, tipWrap('contributions', 'tipContributions', pa).node, tipWrap('paid', 'tipPaid', { name: names.A, amount: fmtMoney(s.fronted.A) }).node,
       tipWrap('guaranteedLeft', 'tipGuaranteedLeft', { ...pa, left: fmtMoney(s.guaranteedLeft.A) }).node,
       tipWrap('plannedLeft', 'tipPlannedLeft', { ...pa, left: fmtMoney(s.plannedLeft.A) }).node,
       tipWrap('projectedLeft', 'tipProjectedLeft', { ...pa, left: fmtMoney(s.projectedLeft.A) }).node],
      rows
    ),
    fig('potBalance', fmtMoney(snapshot.potBalance), 'tipPotBalance', {
      plan: fmtMoney(s.sharedPlannedTotal), fixed: fmtMoney(s.fixedTotal),
      potpaid: fmtMoney(s.actualSpent - s.fronted.A - s.fronted.B), balance: fmtMoney(s.potBalance),
    }),
  ];
  if (snapshot.settle && (snapshot.settle.A !== 0 || snapshot.settle.B !== 0)) {
    const [p, other] = snapshot.settle.A > 0 ? ['A', 'B'] : ['B', 'A'];
    parts.push(el('p', { class: 'settle' },
      t('settleLine', { from: names[other], to: names[p], amount: fmtMoney(Math.abs(snapshot.settle[p])) })));
  }
  if (snapshot.personalSupport.length) {
    parts.push(el('h3', { text: t('personalSupport') }));
    parts.push(itemTable(
      [t('label'), t('amount')],
      snapshot.personalSupport.map((s) =>
        el('tr', {},
          el('td', { text: s.label }),
          el('td', {
            class: 'num money',
            text: `${state.profiles.find((p) => p.id === s.ownerProfileId)?.name}: ${fmtMoney(s.ownerPays)} + ${
              state.profiles.find((p) => p.id !== s.ownerProfileId)?.name
            }: ${fmtMoney(s.partnerPays)}`,
          })
        )
      )
    ));
  }
  box.replaceChildren(...parts);
}

let confirmAction = null;
let settingsDirty = false;

function showConfirm(message, action) {
  confirmAction = action;
  $('#dlg-confirm-msg').textContent = message;
  $('#dlg-confirm').showModal();
}

function requestClose(dialog) {
  if (dialog.id === 'dlg-settings' && settingsDirty) {
    showConfirm(t('discardChanges'), () => {
      settingsDirty = false;
      dialog.close();
    });
    return;
  }
  dialog.close();
}

async function closeMonth() {
  if (!state.month || state.month.status !== 'open') return;
  await flushAutosave();
  showConfirm(t('confirmClose'), async () => {
    try {
      const closed = await api('POST', `/api/months/${state.month.ym}/close`);
      renderSummaryBody($('#summary-body'), closed.summary, closed);
      $('#dlg-summary').showModal();
      await refreshState();
      await loadMonths();
    } catch (err) {
      notifyError(err);
    }
  });
}

/* ---------- settings (US6) ---------- */

function segmented(name, options, current) {
  return el('div', { class: 'segmented', role: 'radiogroup' },
    ...options.map(([value, label]) =>
      el('label', {},
        el('input', { type: 'radio', name, value, checked: value === current || null }),
        el('span', { text: label })
      )
    )
  );
}

function renderSettings() {
  const box = $('#settings-body');
  box.replaceChildren();

  const me = currentProfile();
  const nameInput = textInput(me?.name ?? '', () => { settingsDirty = true; });
  let selected = PRESET_IDS.includes(me?.theme?.preset) ? me.theme.preset : 'paper';
  let mode = me?.theme?.mode === 'dark' ? 'dark' : 'light';
  const presetGrid = el('div', { class: 'preset-grid', role: 'radiogroup', 'aria-label': t('themeColors') });
  const presetButtons = PRESETS.map((pr) => {
    const btn = el('button', {
      type: 'button',
      class: `preset-btn${pr.id === selected ? ' is-selected' : ''}`,
      role: 'radio',
      'aria-checked': pr.id === selected ? 'true' : 'false',
      onclick: () => updateSelection(pr.id),
    },
      el('span', { class: 'preset-dots' }, ...pr.dots.map((c) => el('i', { style: `background:${c}` }))),
      el('span', { class: 'preset-name', text: t(pr.key) })
    );
    return btn;
  });
  const updateSelection = (id) => {
    selected = id;
    settingsDirty = true;
    presetButtons.forEach((b, i) => {
      const on = PRESETS[i].id === id;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    applyTheme({ theme: { preset: id, mode } });
  };
  presetGrid.append(...presetButtons);
  const modeGroup = segmented('mode', [['light', t('light')], ['dark', t('dark')]], mode);
  modeGroup.addEventListener('change', (e) => {
    mode = e.target.value;
    settingsDirty = true;
    applyTheme({ theme: { preset: selected, mode } });
  });
  box.append(
    el('section', { class: 'settings-section' },
      el('h3', {}, tipWrap('sectionProfile', 'tipSectionProfile').node),
      el('p', { class: 'hint', text: t('profileHint') }),
      field('label', nameInput, 'tipLabel'),
      (() => { const p = el('p', { class: 'field-label', text: t('themeColors') }); attachTip(p, 'tipThemeColors'); return p; })(),
      presetGrid,
      field('mode', modeGroup, 'tipMode'),
      el('div', { class: 'form-grid' },
        el('button', {
          type: 'button',
          class: 'btn',
          text: t('resetTheme'),
          onclick: () => {
            settingsDirty = true;
            updateSelection('paper');
            mode = 'light';
            modeGroup.querySelector('input[value="light"]').checked = true;
            applyTheme({ theme: { preset: 'paper', mode: 'light' } });
          },
        })
      )
    )
  );

  const currencyInput = el('input', { type: 'text', value: state.settings.currencyCode, maxlength: '3', placeholder: 'PLN', 'aria-label': t('currency'), oninput: () => { settingsDirty = true; } });
  const langGroup = segmented('lang', [['en', 'English'], ['pl', 'Polski']], state.settings.language);
  langGroup.addEventListener('change', () => { settingsDirty = true; });
  const catBox = el('div', { class: 'stack' });
  const renderCats = () => {
    catBox.replaceChildren(
      ...state.settings.categories.map((cat, idx) =>
        el('div', { class: 'form-grid cat-row' },
          el('span', { class: 'cat-dot', style: `background:${colorForCategory(cat)}`, 'aria-hidden': 'true' }),
          field('label', textInput(cat, (v) => { state.settings.categories[idx] = v; settingsDirty = true; }), 'tipLabel'),
          el('button', {
            type: 'button',
            class: 'btn btn-danger',
            text: t('remove'),
            onclick: () => {
              state.settings.categories.splice(idx, 1);
              settingsDirty = true;
              renderCats();
            },
          })
        )
      ),
      el('button', {
        type: 'button',
        class: 'btn',
        text: t('add'),
        onclick: () => {
          state.settings.categories.push('');
          settingsDirty = true;
          renderCats();
        },
      })
    );
  };
  renderCats();
  box.append(
    el('section', { class: 'settings-section' },
      el('h3', {}, tipWrap('sectionApp', 'tipSectionApp').node),
      el('div', { class: 'form-grid' },
        field('currency', currencyInput, 'tipCurrency'),
        field('language', langGroup, 'tipLanguage')
      )
    ),
    el('section', { class: 'settings-section' },
      el('h3', {}, tipWrap('categories', 'tipCategories').node),
      catBox
    ),
    el('div', { class: 'form-grid settings-save' },
      el('button', {
        type: 'button',
        class: 'btn btn-primary btn-lg',
        text: t('save'),
        onclick: (e) => withBusy(e.currentTarget, async () => {
          try {
            if (me) {
              await api('PUT', `/api/profiles/${me.id}`, { name: nameInput.value, theme: { preset: selected, mode } });
            }
            await api('PUT', '/api/settings', {
              currencyCode: currencyInput.value.toUpperCase(),
              language: langGroup.querySelector('input:checked')?.value ?? 'en',
              categories: state.settings.categories.filter((c) => c.trim()),
            });
            await refreshState();
            settingsDirty = false;
            renderMonthOptions();
            renderSettings();
            renderMonth();
            notify('ok', t('saved'));
          } catch (err) {
            notifyError(err);
          }
        }),
      })
    )
  );
}

/* ---------- leftover log (US7) ---------- */

async function renderLeftovers(historyData) {
  const box = $('#leftovers-body');
  const ym = state.mostRecentClosedYm;
  if (!ym) {
    box.replaceChildren(el('p', { class: 'hint' }, tipWrap('noLeftoverMonth', 'tipNoLeftoverMonth').node));
    return;
  }
  let data = historyData;
  if (!data) {
    try {
      data = await api('GET', `/api/months/${ym}/history`);
    } catch (err) {
      showErrorMessage(err);
      return;
    }
  }
  const editableMonth = ym === state.mostRecentClosedYm;
  const amountInput = el('input', { type: 'text', inputmode: 'decimal', class: 'num-input', placeholder: t('amount'), 'aria-label': t('amount') });
  amountInput.addEventListener('input', (e) => {
    const clean = sanitizeNumericInput(e.target.value, { decimal: true });
    if (clean !== e.target.value) e.target.value = clean;
  });
  amountInput.addEventListener('blur', (e) => {
    e.target.value = formatMoneyInput(parseFlexibleMoney(e.target.value));
  });
  const noteInput = el('input', { type: 'text', placeholder: t('note'), 'aria-label': t('note') });
  const profileSelect = el('select', {},
    ...state.profiles.map((p) => el('option', { value: p.id, text: p.name }))
  );
  const categorySelect = el('select', {},
    ...state.settings.categories.map((c) => el('option', { value: c, text: c }))
  );
  const loHint = el('p', { class: 'hint' }, `${ym} — `, tipWrap(editableMonth ? 'editHint' : 'readOnly', editableMonth ? 'tipEditHint' : 'tipReadOnly').node);
  box.replaceChildren(...kids(
    loHint,
    editableMonth
      ? el('div', { class: 'form-grid' },
          field('profile', profileSelect, 'tipProfile'),
          field('amount', amountInput, 'tipAmount'),
          field('category', categorySelect, 'tipCategory'),
          field('note', noteInput, 'tipNote'),
          el('button', {
            type: 'button',
            class: 'btn btn-primary',
            text: t('addEntry'),
            onclick: (e) => withBusy(e.currentTarget, async () => {
              try {
                const { leftovers } = await api('POST', `/api/months/${ym}/leftovers`, {
                  profileId: Number(profileSelect.value),
                  amountCents: parseMoney(amountInput.value),
                  category: categorySelect.value,
                  note: noteInput.value,
                });
                renderLeftovers({ ...data, leftovers });
              } catch (err) {
                notifyError(err);
              }
            }),
          })
        )
      : null,
    itemTable(
      [t('profile'), t('amount'), t('category'), t('note'), ''],
      data.leftovers.map((entry) =>
        el('tr', {},
          el('td', { text: state.profiles.find((p) => p.id === entry.profileId)?.name }),
          el('td', { class: 'num money', text: fmtMoney(entry.amountCents) }),
          el('td', { text: entry.category }),
          el('td', { text: entry.note }),
          el('td', {},
            editableMonth
              ? el('button', {
                  type: 'button',
                  class: 'btn btn-danger',
                  text: t('remove'),
                  onclick: () => showConfirm(t('confirmDelete'), async () => {
                    try {
                      const { leftovers } = await api('DELETE', `/api/leftovers/${entry.id}`);
                      renderLeftovers({ ...data, leftovers });
                    } catch (err) {
                      notifyError(err);
                    }
                  }),
                })
              : null
          )
        )
      )
    ), null, tipWrap('nothingYet', 'tipNothingYet').node)
  );
}

/* ---------- history (US8) ---------- */

async function renderHistory() {
  const box = $('#history-body');
  const closed = state.months.filter((m) => m.status === 'closed');
  if (!closed.length) {
    box.replaceChildren(el('p', { class: 'hint' }, tipWrap('historyEmpty', 'tipHistoryEmpty').node));
    return;
  }
  box.replaceChildren();
  try {
    const histories = await Promise.all(
      closed.map((m) => api('GET', `/api/months/${m.ym}/history`))
    );
    for (const data of histories) {
      const section = el('section', { class: 'card' });
      renderSummaryBody(section, data.snapshot, data);
      box.append(el('h3', { text: data.ym }), section);
    }
  } catch (err) {
    showErrorMessage(err);
  }
}

/* ---------- wiring ---------- */

function showErrorMessage(err) {
  console.error(err);
  notify('error', `${t('error')}: ${err.message}`);
}

/* Tooltips on the static chrome (header buttons, badges, section titles, empty state). */
function attachChromeTips() {
  const byId = {
    'btn-settings': 'tipSettings',
    'btn-history': 'tipHistory',
    'btn-leftovers': 'tipLeftoverLog',
    'btn-new-month': 'tipNewMonth',
    'btn-close-month': 'tipCloseMonth',
    'btn-create-month': 'tipCreateMonth',
    'month-status': 'tipOpen',
    'balance-badge': 'tipBalance',
  };
  for (const [id, tipKey] of Object.entries(byId)) {
    const n = document.getElementById(id);
    if (n && !n.classList.contains('has-tip')) attachTip(n, tipKey);
  }
  for (const key of ['monthPlan', 'liveFigures', 'spendingLog', 'personalObligatory', 'noMonthTitle', 'noMonthText', 'whoAreYou']) {
    const n = document.querySelector(`[data-i18n="${key}"]`);
    if (n && !n.classList.contains('has-tip')) attachTip(n, `tip${key[0].toUpperCase()}${key.slice(1)}`);
  }
}

async function init() {
  attachChromeTips();
  $('#profile-switch').addEventListener('change', (e) => setProfile(Number(e.target.value)));
  $('#month-switch').addEventListener('change', async (e) => {
    if (!e.target.value) return;
    await flushAutosave();
    await loadMonth(e.target.value);
  });
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelector('.panel-close')?.addEventListener('click', () => requestClose(dialog));
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog && dialog.id !== 'dlg-pick') requestClose(dialog);
    });
    dialog.addEventListener('cancel', (e) => {
      if (dialog.id === 'dlg-pick' && !state.profileId) return;
      e.preventDefault();
      requestClose(dialog);
    });
  }
  $('#dlg-settings').addEventListener('close', () => applyTheme(currentProfile()));
  const syncTopbarH = () => {
    const h = document.querySelector('.topbar')?.offsetHeight ?? 84;
    document.documentElement.style.setProperty('--topbar-h', `${h}px`);
  };
  window.addEventListener('resize', syncTopbarH);
  syncTopbarH();
  $('#dlg-confirm-cancel').addEventListener('click', () => {
    confirmAction = null;
    $('#dlg-confirm').close();
  });
  $('#dlg-confirm-ok').addEventListener('click', async (e) => {
    const action = confirmAction;
    confirmAction = null;
    $('#dlg-confirm').close();
    if (action) await withBusy(e.currentTarget, action);
  });
  $('#btn-create-month').addEventListener('click', (e) => withBusy(e.currentTarget, async () => {
    try {
      await createMonth();
    } catch (err) {
      showErrorMessage(err);
    }
  }));
  $('#btn-new-month').addEventListener('click', (e) => withBusy(e.currentTarget, async () => {
    try {
      await createMonth();
    } catch (err) {
      showErrorMessage(err);
    }
  }));
  $('#btn-close-month').addEventListener('click', closeMonth);
  $('#btn-settings').addEventListener('click', () => {
    renderSettings();
    $('#dlg-settings').showModal();
  });
  $('#btn-history').addEventListener('click', () => {
    renderHistory();
    $('#dlg-history').showModal();
  });
  $('#btn-leftovers').addEventListener('click', () => {
    renderLeftovers();
    $('#dlg-leftovers').showModal();
  });
  refreshState()
    .then(loadMonths)
    .catch(showErrorMessage)
    .finally(() => document.getElementById('boot')?.remove());
}

init();
