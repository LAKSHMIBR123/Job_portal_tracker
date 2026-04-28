import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import StatusMessage from '../components/StatusMessage';
import { syncAuthUser } from '../features/authSlice';
import { getProfile, updateProfile, changePassword } from '../features/userSlice';

const emptyProfileForm = {
  name: '',
  email: '',
  phone: '',
  location: '',
  headline: '',
  bio: '',
};

const emptyPasswordForm = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMON_HEADLINES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'React Developer',
  'Node.js Developer',
  'UI/UX Designer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
  'Mobile App Developer',
  'QA Engineer',
];

function getInitials(name = '', email = '') {
  const source = name.trim() || email.trim();

  if (!source) {
    return 'JP';
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getAsyncErrorMessage(action, fallbackMessage) {
  if (typeof action.payload === 'string' && action.payload.trim()) {
    return action.payload;
  }

  if (typeof action.error?.message === 'string' && action.error.message.trim()) {
    return action.error.message;
  }

  return fallbackMessage;
}

function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, loading } = useSelector((state) => state.user);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [profileNotice, setProfileNotice] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    const source = profile || user;

    if (!source) {
      return;
    }

    setProfileForm({
      name: source.name || '',
      email: source.email || '',
      phone: source.phone || source.mobile || '',
      location: source.location || source.address || '',
      headline: source.headline || source.title || '',
      bio: source.bio || source.summary || '',
    });
  }, [profile, user]);

  const updateProfileField = (field) => (event) => {
    setProfileForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));

    if (profileNotice) {
      setProfileNotice('');
    }

    if (profileError) {
      setProfileError('');
    }

    if (field === 'headline') {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setProfileForm((currentForm) => ({
      ...currentForm,
      headline: suggestion,
    }));
    setShowSuggestions(false);
  };

  const filteredSuggestions = COMMON_HEADLINES.filter((h) =>
    h.toLowerCase().includes(profileForm.headline.toLowerCase())
  );

  const updatePasswordField = (field) => (event) => {
    setPasswordForm((currentForm) => ({
      ...currentForm,
      [field]: event.target.value,
    }));

    if (passwordNotice) {
      setPasswordNotice('');
    }

    if (passwordError) {
      setPasswordError('');
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileNotice('');
    setProfileError('');

    const payload = {
      name: profileForm.name.trim(),
      email: profileForm.email.trim().toLowerCase(),
      phone: profileForm.phone.trim(),
      location: profileForm.location.trim(),
      headline: profileForm.headline.trim(),
      bio: profileForm.bio.trim(),
    };

    if (!payload.name || !payload.email) {
      setProfileError('Name and email are required.');
      return;
    }

    if (!emailPattern.test(payload.email)) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const action = await dispatch(updateProfile(payload));

      if (updateProfile.fulfilled.match(action)) {
        dispatch(syncAuthUser(payload));
        setProfileNotice('Profile updated successfully.');
        return;
      }

      setProfileError(getAsyncErrorMessage(action, 'Failed to update profile.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordNotice('');
    setPasswordError('');

    const payload = {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    };

    if (!payload.oldPassword || !payload.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (payload.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (payload.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password must match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const action = await dispatch(changePassword(payload));

      if (changePassword.fulfilled.match(action)) {
        setPasswordNotice('Password changed successfully.');
        setPasswordForm(emptyPasswordForm);
        return;
      }

      setPasswordError(getAsyncErrorMessage(action, 'Failed to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = getInitials(profileForm.name, profileForm.email);

  return (
    <section className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <div className="profile-header__copy">
            <p className="auth-kicker">Account center</p>
            <h1 className="profile-title">Edit your profile</h1>
            <p className="profile-copy">
              Keep your public details up to date and manage your account security from
              one place.
            </p>
          </div>

          <div className="profile-badge">
            <span className="profile-badge__label">Signed in as</span>
            {loading && !profile ? (
              <Loader compact label="Loading profile..." />
            ) : (
              <strong>{profileForm.email || user?.email || 'Member account'}</strong>
            )}
          </div>
        </header>

        <div className="profile-layout">
          <section className="profile-panel profile-panel--wide">
            <div className="profile-panel__header">
              <div>
                <p className="profile-panel__eyebrow">Update profile</p>
                <h2 className="profile-panel__title">Personal details</h2>
              </div>
              <p className="profile-panel__text">
                These details can be shown across your dashboard and applications.
              </p>
            </div>

            <div className="profile-identity">
              <div className="profile-avatar" aria-hidden="true">
                {initials}
              </div>

              <div className="profile-identity__copy">
                <h3>{profileForm.name || 'Your profile'}</h3>
                <p>{profileForm.headline || 'Add a short professional headline'}</p>
              </div>
            </div>

            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="profile-form__grid">
                <div className="profile-form__field">
                  <label htmlFor="profile-name">Full name</label>
                  <input
                    id="profile-name"
                    className="profile-input"
                    value={profileForm.name}
                    onChange={updateProfileField('name')}
                    placeholder="Lakshmi"
                    autoComplete="name"
                  />
                </div>

                <div className="profile-form__field">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    className="profile-input"
                    type="email"
                    value={profileForm.email}
                    onChange={updateProfileField('email')}
                    placeholder="lakshmibr2003@gmail.com"
                    autoComplete="email"
                  />
                </div>

                <div className="profile-form__field">
                  <label htmlFor="profile-phone">Phone</label>
                  <input
                    id="profile-phone"
                    className="profile-input"
                    type="tel"
                    value={profileForm.phone}
                    onChange={updateProfileField('phone')}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </div>

                <div className="profile-form__field">
                  <label htmlFor="profile-location">Location</label>
                  <input
                    id="profile-location"
                    className="profile-input"
                    value={profileForm.location}
                    onChange={updateProfileField('location')}
                    placeholder="Bengaluru, India"
                    autoComplete="address-level2"
                  />
                </div>

                <div className="profile-form__field profile-form__field--full profile-form__field--relative">
                  <label htmlFor="profile-headline">Professional headline</label>
                  <input
                    id="profile-headline"
                    className="profile-input"
                    value={profileForm.headline}
                    onChange={updateProfileField('headline')}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Frontend Developer"
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <ul className="profile-suggestions">
                      {filteredSuggestions.map((suggestion) => (
                        <li
                          key={suggestion}
                          className="profile-suggestion-item"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="profile-form__field profile-form__field--full">
                  <label htmlFor="profile-bio">About you</label>
                  <textarea
                    id="profile-bio"
                    className="profile-input profile-input--textarea"
                    value={profileForm.bio}
                    onChange={updateProfileField('bio')}
                    placeholder="Tell recruiters a little about your experience, strengths, and goals."
                    rows="5"
                  />
                </div>
              </div>

              <button className="auth-button profile-panel__action" type="submit">
                {isSavingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </form>

            <StatusMessage
              message={profileNotice}
              title="Profile updated"
              variant="success"
            />
            <StatusMessage
              message={profileError}
              title="Couldn't update profile"
              variant="error"
            />
          </section>

          <section className="profile-panel">
            <div className="profile-panel__header">
              <div>
                <p className="profile-panel__eyebrow">Change password</p>
                <h2 className="profile-panel__title">Security</h2>
              </div>
              <p className="profile-panel__text">
                Use a strong password that you do not reuse elsewhere.
              </p>
            </div>

            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <div className="profile-form__field">
                <label htmlFor="old-password">Old password</label>
                <input
                  id="old-password"
                  className="profile-input"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={updatePasswordField('oldPassword')}
                  placeholder="Enter old password"
                  autoComplete="current-password"
                />
              </div>

              <div className="profile-form__field">
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  className="profile-input"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={updatePasswordField('newPassword')}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>

              <div className="profile-form__field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  className="profile-input"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={updatePasswordField('confirmPassword')}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>

              <div className="profile-security-note">
                <h3>Password tips</h3>
                <ul className="profile-security-note__list">
                  <li>Use at least 6 characters.</li>
                  <li>Mix letters, numbers, and symbols when possible.</li>
                  <li>Avoid passwords you already use on other sites.</li>
                </ul>
              </div>

              <button className="auth-button profile-panel__action" type="submit">
                {isChangingPassword ? 'Updating...' : 'Update password'}
              </button>
            </form>

            <StatusMessage
              message={passwordNotice}
              title="Password updated"
              variant="success"
            />
            <StatusMessage
              message={passwordError}
              title="Couldn't update password"
              variant="error"
            />
          </section>
        </div>
      </div>
    </section>
  );
}

export default Profile;
