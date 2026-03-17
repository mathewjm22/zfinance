import { parseYearlySummaryText } from './src/utils/pdfParser.ts';

const text = `Category, not sortedCategory
Amount spent, , sort highest to lowestAmount spent
Percent of total
PersonalShow details
$2,418.81	26%
TravelShow details
$1,764.97	19%
ShoppingShow details
$1,394.08	15%
Food & drinkShow details
$1,342.95	14%
GroceriesShow details
$1,333.90	14%
Health & wellnessShow details
$277.75	3%
AutomotiveShow details
$253.19	3%
GasShow details
$208.52	2%
Bills & utilitiesShow details
$118.92	1%
Professional servicesShow details
$100.00	1%
Gifts & donationsShow details
$50.00	1%
EntertainmentShow details
$26.30	0.3%
HomeShow details
$21.24	0.2%`;

console.log(parseYearlySummaryText(text, '2024-03-31', []));
