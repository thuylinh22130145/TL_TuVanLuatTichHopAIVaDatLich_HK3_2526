import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';

const { sequelize } = await import('../src/config/database.js');
const { Lawyer, User } = await import('../src/models/index.js');
const { updateLawyer } = await import('../src/services/lawyerService.js');
const { updatePortalProfile } = await import('../src/services/lawyerPortalService.js');

let user;
let lawyer;

before(async () => {
  await sequelize.sync({ force: true });
  user = await User.create({
    username: 'avatar.sync.lawyer',
    email: 'avatar-sync@example.com',
    password_hash: 'not-used',
    full_name: 'Luật sư Đồng Bộ',
    role: 'LAWYER',
    status: 'ACTIVE',
  });
  lawyer = await Lawyer.create({
    user_id: user.id,
    full_name: user.full_name,
    email: user.email,
    specialization: 'Dân sự',
    status: 'active',
  });
});

after(async () => {
  await sequelize.close();
});

test('lawyer profile update stores the avatar on user and public lawyer records', async () => {
  const avatar = 'https://example.com/lawyer-self.jpg';
  await updatePortalProfile(user.id, { avatar_url: avatar });

  assert.equal((await User.findByPk(user.id)).avatar_url, avatar);
  assert.equal((await Lawyer.findByPk(lawyer.id)).avatar_url, avatar);
});

test('admin lawyer update keeps the linked user avatar synchronized', async () => {
  const avatar = 'https://example.com/lawyer-admin.jpg';
  await updateLawyer(lawyer.id, { avatar_url: avatar });

  assert.equal((await User.findByPk(user.id)).avatar_url, avatar);
  assert.equal((await Lawyer.findByPk(lawyer.id)).avatar_url, avatar);
});
