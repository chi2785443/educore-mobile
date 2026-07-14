const { by, element, waitFor } = require('detox');

// Detox's typeText calls straight into the RN bridge (no per-keystroke accessibility
// simulation), so unlike the Maestro flows there's no need to split email/password
// into halves to dodge a gRPC deadline.
async function login({ email, password }) {
  await device.launchApp({ newInstance: true, permissions: { location: 'inuse', camera: 'YES', microphone: 'YES', notifications: 'YES' } });

  try {
    await waitFor(element(by.text('Skip'))).toBeVisible().withTimeout(15000);
    await element(by.text('Skip')).tap();
  } catch (e) {
    // already past onboarding
  }

  await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(15000);
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('password-input')).tapReturnKey();
  await element(by.id('sign-in-button')).tap();
  await waitFor(element(by.text('Features'))).toBeVisible().withTimeout(20000);
}

async function logout() {
  await element(by.text('Account')).tap();
  await waitFor(element(by.text('Sign Out'))).toBeVisible().whileElement(by.id('account-scroll-view')).scroll(300, 'down');
  await element(by.text('Sign Out')).tap();
  await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(15000);
}

// Most Features-grid cards are below the fold (the grid has 8-14+ cards depending
// on role), so tapping straight after "Features" only works for the first couple
// of rows. Scroll the card into view first, then tap it.
async function tapFeatureCard(cardText) {
  await element(by.text('Features')).tap();
  await waitFor(element(by.text(cardText)))
    .toBeVisible()
    .whileElement(by.id('features-scroll-view'))
    .scroll(300, 'down');
  await element(by.text(cardText)).tap();
}

module.exports = { login, logout, tapFeatureCard };
