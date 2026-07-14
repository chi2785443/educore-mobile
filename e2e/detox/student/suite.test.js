const { login, logout, tapFeatureCard } = require('../shared/auth');
const creds = require('../shared/credentials');

describe('Student - full smoke suite', () => {
  describe('as student', () => {
    beforeAll(async () => {
      await login(creds.student);
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

    it.skip("deep_take_assessment [needs real testIDs before this can run]: takes and submits an assessment", async () => {
      await tapFeatureCard('My Assessments');
      await waitFor(element(by.text('My Assessments'))).toBeVisible().withTimeout(15000);

      // TODO: Maestro used a point-based tap (50%,20%) for the first assessment
      // card — needs a testID on the card component, pinned down on a live run.
      await element(by.id('assessment-card')).atIndex(0).tap();
      await element(by.text('Start')).tap();
      await waitFor(element(by.text('Question 1'))).toBeVisible().withTimeout(20000);

      // TODO: Maestro tapped an answer option at point (20%,45%) — needs a testID
      // on the answer-option component.
      await element(by.id('answer-option')).atIndex(0).tap();
      await element(by.text('Next')).tap();

      try {
        await waitFor(element(by.text('Submit'))).toBeVisible().withTimeout(15000);
        await element(by.text('Submit')).tap();
        await element(by.text('Confirm')).tap();
      } catch (e) {
        // already submitted / no confirm dialog
      }

      await waitFor(element(by.text('Submitted'))).toBeVisible().withTimeout(20000);
    });

    it.skip("deep_view_report_card [needs real testIDs before this can run]: opens the report card and sees First Term subject scores", async () => {
      await tapFeatureCard('My Results');
      await waitFor(element(by.text('My Results'))).toBeVisible().withTimeout(15000);

      // TODO: Maestro used a point-based tap (50%,25%) for the first result card —
      // needs a testID on the card component, pinned down on a live run.
      await element(by.id('result-card')).atIndex(0).tap();
      await waitFor(element(by.text('First Term'))).toBeVisible().withTimeout(15000);
      await waitFor(element(by.text('Mathematics'))).toBeVisible().withTimeout(10000);
    });

    it("smoke_account: navigates to Sign Out and back", async () => {
      await element(by.text('Account')).tap();
      await waitFor(element(by.text('Sign Out'))).toBeVisible().whileElement(by.id('account-scroll-view')).scroll(300, 'down');
    });

    it("smoke_assessments: navigates to My Assessments and back", async () => {
      await tapFeatureCard('My Assessments');
      await waitFor(element(by.text('My Assessments'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_attendance: navigates to My Attendance and back", async () => {
      await tapFeatureCard('Attendance');
      await waitFor(element(by.text('My Attendance'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_chat: navigates to Chat and back", async () => {
      await element(by.text('Chat')).tap();
      await waitFor(element(by.text('Chat'))).toBeVisible().withTimeout(15000);
    });

    it("smoke_documents: navigates to My Documents and back", async () => {
      await tapFeatureCard('My Documents');
      await waitFor(element(by.text('My Documents'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_enrollments: navigates to My Enrollments and back", async () => {
      await tapFeatureCard('Enrollments');
      await waitFor(element(by.text('My Enrollments'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_finances: navigates to My Finances and back", async () => {
      await tapFeatureCard('My Finances');
      await waitFor(element(by.text('My Finances'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_library: navigates to Library and back", async () => {
      await tapFeatureCard('Library');
      await waitFor(element(by.text('Library'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_notifications: navigates to Notifications and back", async () => {
      await device.openURL({ url: 'cakale-edu://notifications' });
      await waitFor(element(by.text('Notifications'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_results: navigates to My Results and back", async () => {
      await tapFeatureCard('My Results');
      await waitFor(element(by.text('My Results'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_scores: navigates to My Scores and back", async () => {
      await tapFeatureCard('My Scores');
      await waitFor(element(by.text('My Scores'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

  });

});
