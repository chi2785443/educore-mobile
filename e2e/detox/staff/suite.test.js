const { login, logout, tapFeatureCard } = require('../shared/auth');
const creds = require('../shared/credentials');

describe('Staff - full smoke suite', () => {
  describe('as staff', () => {
    beforeAll(async () => {
      await login(creds.staff);
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

    it.skip("deep_create_assessment [needs real testIDs before this can run]: creates a new assessment for JSS1A Mathematics", async () => {
      await tapFeatureCard('Assessments');
      await waitFor(element(by.text('Assessments'))).toBeVisible().withTimeout(15000);

      try {
        await element(by.id('create-assessment-fab')).tap();
      } catch (e) {
        await element(by.text('+')).tap();
      }

      await element(by.text('JSS 1A')).tap();
      await element(by.text('Mathematics')).tap();
      await element(by.id('assessment-title-input')).typeText('E2E Smoke Test');
      await element(by.text('Test')).tap();
      await element(by.text('Save')).tap();
      await waitFor(element(by.text('E2E Smoke Test'))).toBeVisible().withTimeout(15000);
    });

    it.skip("deep_handle_retake_request [needs real testIDs before this can run]: approves a pending retake request", async () => {
      await tapFeatureCard('Assessments');
      await waitFor(element(by.text('Assessments'))).toBeVisible().withTimeout(15000);

      // TODO: the Maestro original used a point-based tap (50%,20%) to hit the first
      // assessment card, since list items don't carry a distinguishing testID yet.
      // Detox has no percentage-based tap; this needs a testID on the assessment
      // card component before it can run, pinned down on a live run.
      await element(by.id('assessment-card')).atIndex(0).tap();
      await element(by.text('Retakes')).tap();
      await element(by.text('Approve')).atIndex(0).tap();
      await waitFor(element(by.text('Approved'))).toBeVisible().withTimeout(15000);
    });

    it("deep_mark_attendance: clocks in for attendance", async () => {
      await tapFeatureCard('Attendance');
      await waitFor(element(by.text('My Attendance'))).toBeVisible().withTimeout(15000);
      await element(by.text('Clock In')).tap();
      await waitFor(element(by.text('Clocked In'))).toBeVisible().withTimeout(20000);
    });

    it("smoke_account: navigates to Sign Out and back", async () => {
      await element(by.text('Account')).tap();
      await waitFor(element(by.text('Sign Out'))).toBeVisible().whileElement(by.id('account-scroll-view')).scroll(300, 'down');
    });

    it("smoke_assessments: navigates to Assessments and back", async () => {
      await tapFeatureCard('Assessments');
      await waitFor(element(by.text('Assessments'))).toBeVisible().withTimeout(15000);
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

    it("smoke_finances: navigates to My Finances and back", async () => {
      await tapFeatureCard('My Finances');
      await waitFor(element(by.text('My Finances'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_generate_results: navigates to Generate Results and back", async () => {
      await tapFeatureCard('Generate Results');
      await waitFor(element(by.text('Generate Results'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_library: navigates to Library and back", async () => {
      await tapFeatureCard('Library');
      await waitFor(element(by.text('Library'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_my_jobs: navigates to My Jobs and back", async () => {
      await tapFeatureCard('My Jobs');
      await waitFor(element(by.text('My Jobs'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_notifications: navigates to Notifications and back", async () => {
      await device.openURL({ url: 'cakale-edu://notifications' });
      await waitFor(element(by.text('Notifications'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_question_bank: navigates to Question Bank and back", async () => {
      await tapFeatureCard('Question Bank');
      await waitFor(element(by.text('Question Bank'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_results: navigates to Class Results and back", async () => {
      await tapFeatureCard('Results');
      await waitFor(element(by.text('Class Results'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_scores: navigates to Assessment Scores and back", async () => {
      await tapFeatureCard('Scores');
      await waitFor(element(by.text('Assessment Scores'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

  });

  describe('as staffFinance', () => {
    beforeAll(async () => {
      await login(creds.staffFinance);
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

    it("smoke_finance_staff_finances: navigates to My Finances and back", async () => {
      await tapFeatureCard('My Finances');
      await waitFor(element(by.text('My Finances'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

  });

});
