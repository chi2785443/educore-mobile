const { login, logout, tapFeatureCard } = require('../shared/auth');
const creds = require('../shared/credentials');

describe('Admin - full smoke suite', () => {
  describe('as admin', () => {
    beforeAll(async () => {
      await login(creds.admin);
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

    it("dashboard: sees the school dashboard after login", async () => {
      await waitFor(element(by.text('Hello, Chinedu!'))).toBeVisible().withTimeout(15000);
    });

    it.skip("deep_approve_student_report [needs real testIDs before this can run]: approves the first pending student report for JSS1A", async () => {
      await device.openURL({ url: 'cakale-edu://admin-results' });
      await waitFor(element(by.text('Results Overview'))).toBeVisible().withTimeout(15000);
      await element(by.text('JSS 1A')).tap();

      // TODO: whileElement's scroll target needs a real testID on this screen's
      // ScrollView — placeholder below, pin down on a live run.
      await waitFor(element(by.text('Pending'))).toBeVisible().whileElement(by.id('results-scroll-view')).scroll(300, 'down');
      await element(by.text('Pending')).atIndex(0).tap();

      // TODO: same as above — placeholder scroll-view testID.
      await waitFor(element(by.text('Approve'))).toBeVisible().whileElement(by.id('report-detail-scroll-view')).scroll(300, 'down');
      await element(by.text('Approve')).tap();
      await waitFor(element(by.text('Approved'))).toBeVisible().withTimeout(15000);
    });

    it.skip("deep_generate_and_publish_results [needs real testIDs before this can run]: generates then publishes JSS1A term results", async () => {
      await tapFeatureCard('Generate Results');
      await waitFor(element(by.text('Generate Results'))).toBeVisible().withTimeout(15000);
      await element(by.text('JSS 1A')).tap();

      // TODO: placeholder scroll-view testID — pin down on a live run.
      await waitFor(element(by.text('Generate'))).toBeVisible().whileElement(by.id('generate-results-scroll-view')).scroll(300, 'down');
      await element(by.text('Generate')).tap();
      await waitFor(element(by.text('success'))).toBeVisible().withTimeout(20000);
      await device.pressBack();

      await device.openURL({ url: 'cakale-edu://admin-results' });
      await waitFor(element(by.text('Results Overview'))).toBeVisible().withTimeout(15000);
      await element(by.text('JSS 1A')).tap();

      // TODO: placeholder scroll-view testID — pin down on a live run.
      await waitFor(element(by.text('Publish'))).toBeVisible().whileElement(by.id('results-scroll-view')).scroll(300, 'down');
      await element(by.text('Publish')).tap();
      await waitFor(element(by.text('Published'))).toBeVisible().withTimeout(20000);
    });

    it.skip("deep_respond_to_enquiry [needs real testIDs before this can run]: sends a reply to the first enquiry", async () => {
      await tapFeatureCard('Enquiries');
      await waitFor(element(by.text('School Enquiries'))).toBeVisible().withTimeout(15000);

      // TODO: Maestro used a point-based tap (50%,25%) for the first enquiry card —
      // needs a testID on the card component, pinned down on a live run.
      await element(by.id('enquiry-card')).atIndex(0).tap();

      try {
        await element(by.id('reply-input')).tap();
      } catch (e) {
        // reply input already focused / no scroll needed
      }

      await element(by.id('reply-input')).typeText(
        'Thank you for reaching out — our admissions team will follow up shortly.'
      );
      await element(by.text('Send')).tap();
      await waitFor(element(by.text('Thank you for reaching out'))).toBeVisible().withTimeout(15000);
    });

    it("smoke_account: navigates to Sign Out and back", async () => {
      await element(by.text('Account')).tap();
      // "Sign Out" is below the fold on this screen — needs a scroll, same as logout().
      await waitFor(element(by.text('Sign Out'))).toBeVisible().whileElement(by.id('account-scroll-view')).scroll(300, 'down');
    });

    it("smoke_admin_results: navigates to Results Overview and back", async () => {
      await device.openURL({ url: 'cakale-edu://admin-results' });
      await waitFor(element(by.text('Results Overview'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
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
      // "My Documents" matches both the header and a folder row on this screen.
      await waitFor(element(by.text('My Documents')).atIndex(0)).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_enquiries: navigates to School Enquiries and back", async () => {
      await tapFeatureCard('Enquiries');
      await waitFor(element(by.text('School Enquiries'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_enrollments: navigates to Enrollments and back", async () => {
      await tapFeatureCard('Enrollments');
      // Real screen header is "Enrollments", not "My Enrollments" as originally assumed.
      await waitFor(element(by.text('Enrollments')).atIndex(0)).toBeVisible().withTimeout(15000);
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

    it("smoke_manage_jobs: navigates to Manage Jobs and back", async () => {
      await tapFeatureCard('Manage Jobs');
      await waitFor(element(by.text('Manage Jobs'))).toBeVisible().withTimeout(15000);
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

    it("smoke_staff_attendance: navigates to Staff Attendance and back", async () => {
      await tapFeatureCard('Staff Attendance');
      await waitFor(element(by.text('Staff Attendance'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

    it("smoke_subscription: navigates to Subscription and back", async () => {
      await device.openURL({ url: 'cakale-edu://subscription' });
      await waitFor(element(by.text('Subscription'))).toBeVisible().withTimeout(15000);
      await device.pressBack();
    });

  });

});
