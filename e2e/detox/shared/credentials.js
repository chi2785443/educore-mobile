// Mirrors e2e/maestro/.env.example — password is the same seeded value for every demo account.
const PASSWORD = 'Demo@2026!';

module.exports = {
  admin: { email: 'test@mail.cakale.com', password: PASSWORD },
  staff: { email: 'ifeoma.chukwu@mail.cakale.com', password: PASSWORD },
  staffFinance: { email: 'segun.ojo@mail.cakale.com', password: PASSWORD },
  student: { email: 'chioma.eze@mail.cakale.com', password: PASSWORD },
  parent: { email: 'chinwe.eze.parent@mail.cakale.com', password: PASSWORD },
};
