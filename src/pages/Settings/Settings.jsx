import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import './Settings.css';

function SettingIcon({ type }) {
  const icons = {
    user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    phone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    mail: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    key: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    building: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  };
  return icons[type] || null;
}

function Settings() {
  const { user, updateUser } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Company Profile state
  const [companyForm, setCompanyForm] = useState({
    company_name: '', address: '', phone: '', email: '',
    pan: '', gstin: '', place_of_supply: '', logo_base64: '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  // Load company profile
  const fetchCompanyProfile = useCallback(async () => {
    try {
      const res = await api.get('/company-profile');
      if (res.data) {
        setCompanyForm({
          company_name: res.data.company_name || '',
          address: res.data.address || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          pan: res.data.pan || '',
          gstin: res.data.gstin || '',
          place_of_supply: res.data.place_of_supply || '',
          logo_base64: res.data.logo_base64 || '',
        });
      }
    } catch (err) {
      console.error('Failed to load company profile:', err);
    }
  }, []);

  useEffect(() => { fetchCompanyProfile(); }, [fetchCompanyProfile]);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.put('/users/profile', profileForm);
      if (response.success) {
        updateUser(response.user);
        showToast('Profile updated successfully');
        setActiveModal(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Passwords do not match', true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.patch('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (response.success) {
        showToast('Password changed successfully');
        setActiveModal(null);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      showToast(err.message || 'Failed to change password', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.put('/company-profile', companyForm);
      if (response.success) {
        showToast('Company profile saved — auto-applies to all invoices');
        setActiveModal(null);
      }
    } catch (err) {
      showToast(err.message || 'Failed to save company profile', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be under 2MB', true);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyForm(prev => ({ ...prev, logo_base64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings-page">
      {toast && (
        <div className={`settings-toast ${toast.isError ? 'error' : ''}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div className="page-title-group">
          <h1>Settings</h1>
          <p>Manage your account settings and preferences.</p>
        </div>
      </div>

      {/* ===== COMPANY PROFILE CARD ===== */}
      <div className="settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-row" style={{ borderBottom: companyForm.company_name ? '1px solid var(--border-color, #eee)' : 'none' }}>
          <div className="settings-info-group">
            <div className="settings-icon-wrapper" style={{ background: '#6C5CE715', color: '#6C5CE7' }}>
              <SettingIcon type="building" />
            </div>
            <div className="settings-details">
              <span className="settings-label" style={{ fontSize: '14px', fontWeight: 700 }}>Company Profile (Bill From Template)</span>
              <span className="settings-value" style={{ fontSize: '12px', color: '#888' }}>
                {companyForm.company_name
                  ? `${companyForm.company_name} • ${companyForm.gstin || 'No GSTIN'}`
                  : 'Not configured — click Configure to set up your invoice template'}
              </span>
            </div>
          </div>
          <button className="settings-action-btn" onClick={() => setActiveModal('company')} style={{ background: '#6C5CE7', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 600 }}>
            {companyForm.company_name ? 'Edit' : 'Configure'}
          </button>
        </div>

        {companyForm.company_name && (
          <div className="company-preview-row">
            {companyForm.logo_base64 && (
              <img src={companyForm.logo_base64} alt="Logo" className="logo-preview" />
            )}
            <div className="company-preview-chips">
              <span>📍 {companyForm.address || 'N/A'}</span>
              <span>📞 {companyForm.phone || 'N/A'}</span>
              <span>📧 {companyForm.email || 'N/A'}</span>
              <span>PAN: {companyForm.pan || 'N/A'}</span>
              <span>GSTIN: {companyForm.gstin || 'N/A'}</span>
              <span>📦 {companyForm.place_of_supply || 'N/A'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ===== ACCOUNT SETTINGS CARD ===== */}
      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-info-group">
            <div className="settings-icon-wrapper"><SettingIcon type="user" /></div>
            <div className="settings-details">
              <span className="settings-label">Full Name</span>
              <span className="settings-value">{user?.name || 'Not set'}</span>
            </div>
          </div>
          <button className="settings-action-btn" onClick={() => setActiveModal('profile')}><SettingIcon type="edit" /> Edit</button>
        </div>
        <div className="settings-row">
          <div className="settings-info-group">
            <div className="settings-icon-wrapper"><SettingIcon type="phone" /></div>
            <div className="settings-details">
              <span className="settings-label">Phone Number</span>
              <span className="settings-value">{user?.phone || 'Not set'}</span>
            </div>
          </div>
          <button className="settings-action-btn" onClick={() => setActiveModal('profile')}><SettingIcon type="edit" /> Edit</button>
        </div>
        <div className="settings-row">
          <div className="settings-info-group">
            <div className="settings-icon-wrapper"><SettingIcon type="mail" /></div>
            <div className="settings-details">
              <span className="settings-label">Email Address</span>
              <span className="settings-value">{user?.email}</span>
            </div>
          </div>
          <button className="settings-action-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>Primary</button>
        </div>
        <div className="settings-row">
          <div className="settings-info-group">
            <div className="settings-icon-wrapper"><SettingIcon type="lock" /></div>
            <div className="settings-details">
              <span className="settings-label">Password</span>
              <span className="settings-value">••••••••••••</span>
            </div>
          </div>
          <button className="settings-action-btn" onClick={() => setActiveModal('password')}><SettingIcon type="key" /> Change Password</button>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {activeModal === 'profile' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <p>Update your personal information.</p>
            </div>
            <form className="modal-form" onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'password' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <p>Ensure your account is using a long, random password to stay secure.</p>
            </div>
            <form className="modal-form" onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={isLoading}>{isLoading ? 'Updating...' : 'Update Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'company' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Company Profile (Bill From)</h2>
              <p>Set this once — it auto-populates "Bill From" on every invoice.</p>
            </div>
            <form className="modal-form" onSubmit={handleCompanySubmit}>
              <div className="form-group">
                <label>Company Logo</label>
                <div className="logo-upload-area">
                  {companyForm.logo_base64 ? (
                    <img src={companyForm.logo_base64} alt="Logo" className="logo-preview" />
                  ) : (
                    <div className="logo-placeholder">No Logo</div>
                  )}
                  <div className="logo-upload-controls">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} />
                    <span className="logo-upload-hint">PNG, JPG, SVG — Max 2MB</span>
                  </div>
                  {companyForm.logo_base64 && (
                    <button type="button" className="logo-remove-btn" onClick={() => setCompanyForm(prev => ({ ...prev, logo_base64: '' }))}>Remove</button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" value={companyForm.company_name} onChange={e => setCompanyForm({ ...companyForm, company_name: e.target.value })} placeholder="One Assist Technologies" required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Address</label>
                  <textarea rows={2} value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} placeholder="Full registered office address" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} placeholder="billing@company.com" />
                </div>
                <div className="form-group">
                  <label>PAN Number</label>
                  <input type="text" value={companyForm.pan} onChange={e => setCompanyForm({ ...companyForm, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" maxLength={10} />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input type="text" value={companyForm.gstin} onChange={e => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
                <div className="form-group">
                  <label>Place of Supply</label>
                  <input type="text" value={companyForm.place_of_supply} onChange={e => setCompanyForm({ ...companyForm, place_of_supply: e.target.value })} placeholder="Tamil Nadu" />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Company Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
