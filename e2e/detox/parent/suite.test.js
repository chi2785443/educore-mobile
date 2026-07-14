const { login, logout, tapFeatureCard } = require('../shared/auth');
const creds = require('../shared/credentials');

describe('Parent - full smoke suite', () => {
  describe('as parent', () => {
    beforeAll(async () => {
      await login(creds.parent);
    });

    afterAll(async () => {
      await logout();
    });

    beforeEach(async () => {
      try {
        await element(by.text('Home')).atIndex(0).tap();
      } catch (e) {
        // already on Home, or Home tab not visible yet
      }
    });

    it.skip("deep_submit_enquiry [needs real testIDs before this can run]: submits a new enquiry", async () => {
      await tapFeatureCard('Enquiries');
      await waitFor(element(by.text('My Enquiries'))).toBeVisible().withTimeout(15000);

      try {
        await element(by.id('new-enquiry-fab')).tap();
      } catch (e) {
        await element(by.text('+')).tap();
      }

      await element(by.id('enquiry-message-input')).typeText(
        'E2E test enquiry: what time does the school gate open?'
      );
      await element(by.text('Send')).tap();
      await waitFor(element(by.text('E2E test enquiry'))).toBeVisible().withTimeout(15000);
    });

    it.skip("deep_view_child_results_and_reports [needs real testIDs before this can run]: views the child result and report", async () => {
      await tapFeatureCard("Children's Results");
      await waitFor(element(by.text("Children's Results"))).toBeVisible().withTimeout(15000);

      // TODO: Maestro used a point-based tap (50%,25%) for the first child card —
      // needs a testID on the card component, pinned down on a live run.
      await element(by.id('child-result-card')).atIndex(0).tap();
      await waitFor(element(by.text('First Term'))).toBeVisible().withTimeout(15000);
      await device.pressBack();

      await tapFeatureCard("Children's Reports");
      await waitFor(element(by.text("Children's Reports"))).toBeVisible().withTimeout(15000);
      await element(by.id('child-report-card')).atIndex(0).tap();
      await waitFor(element(by.text('Approved'))).toBeVisible().withTimeout(15000);
    });

    it("smoke_account: navigates to Sign Out and back", async () => {
      await element(by.text('Account')).tap();
      await waitFor(element(by.text('Sign Out'))).toBeVisible().whileElement(by.id('account-scroll-view')).scroll(300, 'down');
    });

    it("smoke_chat: navigates to Chat and back", async () => {
      await element(by.text('Chat')).tap();
      await waitFor(element(by.text('Chat'))).toBeVisible().withTimeout(15000);
    });

    it("smoke_enquiries: navigates to My Enquiries and back", async () => {
      await tapFeatureCard('Enquiries');
      await waitFor(element(by.text('My Enquiries'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_features: navigates to My Children and back", async () => {
      await element(by.text('Features')).tap();
      await waitFor(element(by.text('My Children'))).toBeVisible().withTimeout(15000);
    });

    it("smoke_my_children: navigates to My Children and back", async () => {
      await tapFeatureCard('My Children');
      await waitFor(element(by.text('My Children'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_notifications: navigates to Notifications and back", async () => {
      await device.openURL({ url: 'cakale-edu://notifications' });
      await waitFor(element(by.text('Notifications'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_children_documents: navigates to Children's Documents and back", async () => {
      await tapFeatureCard("Children's Documents");
      await waitFor(element(by.text("Children's Documents"))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_children_reports: navigates to Children's Reports and back", async () => {
      await tapFeatureCard("Children's Reports");
      await waitFor(element(by.text("Children's Reports"))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_children_results: navigates to Children's Results and back", async () => {
      await tapFeatureCard("Children's Results");
      await waitFor(element(by.text("Children's Results"))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

  });

});
