// Expected UI texts for the language the suite runs in.
//
// The app starts in Czech. Run the suite with `-e APP_LANG=en` to switch it
// to English on the Home screen (see fresh_launch.yaml) and check the same
// texts in English. A single flow can force a language by setting
// output.forceLang before it runs fresh_launch.yaml.
//
// Texts are copied from lib/l10n/app_strings.dart. Strings the findings call
// wrong (e.g. the Slovak Home button in Czech) are deliberately not asserted
// here, so the suite doesn't cement them.
var lang = output.forceLang
  || (typeof APP_LANG !== 'undefined' ? String(APP_LANG) : 'cs');

var TEXTS = {
  cs: {
    continueLabel: 'Pokračovat',
    childNeedsAdult: 'Dítě musí být v doprovodu alespoň jednoho dospělého.',
    required: 'Toto pole je povinné.',
    socialMedia: 'Sociální sítě',
    closed: 'Všechny časy jsou pro dnešek uzavřeny.',
    declined: 'Platba zamítnuta',
    confirmOrder: 'Potvrdit objednávku',
    thankYou: 'Děkujeme Vám za nákup!'
  },
  en: {
    packageButton: 'Select this adventure',
    continueLabel: 'Continue',
    childNeedsAdult: 'A child ticket requires at least one adult.',
    required: 'This field is required.',
    socialMedia: 'Social media',
    closed: 'All times are closed for today.',
    declined: 'Payment declined',
    confirmOrder: 'Confirm order',
    thankYou: 'Thank you for your purchase!'
  }
};

if (!TEXTS[lang]) {
  throw new Error('Unsupported APP_LANG "' + lang + '" - use cs or en');
}
output.lang = lang;
output.t = TEXTS[lang];
console.log('UI language: ' + lang);
