import { useDarkMode } from '../contexts/DarkModeContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useState, useEffect, useCallback } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useMember } from '../contexts/MemberContext';
import { invitationService } from '../services/invitationService';
import { MemberManagement } from '../components/member/MemberManagement';
import { PermissionEditor } from '../components/member/PermissionEditor';

const getRateChange = (currentRate: number, previousRate: number) => {
  const change = ((currentRate - previousRate) / previousRate) * 100;
  return {
    value: change.toFixed(2),
    isIncrease: change > 0,
    isDecrease: change < 0
  };
};

export const SettingsScreen = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { preferences, updatePreferences, exchangeRates, updateExchangeRate, isLoading } = useSettings();
  const { user } = useAuth();
  const { uninviteMember, isPushNotificationSupported, requestNotificationPermission } = useNotifications();
  const { updateMemberPermissions, isOwner } = useMember();
  const [khrRate, setKhrRate] = useState(exchangeRates.KHR_USD.toString());
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRate, setPendingRate] = useState<number | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [showUninviteConfirm, setShowUninviteConfirm] = useState(false);
  const [emailToUninvite, setEmailToUninvite] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

  // Update khrRate when exchangeRates changes
  useEffect(() => {
    setKhrRate(exchangeRates.KHR_USD.toString());
  }, [exchangeRates.KHR_USD]);

  const handleCurrencyChange = async (value: string) => {
    await updatePreferences({ currency: value });
  };

  const handleLanguageChange = async (value: string) => {
    await updatePreferences({ language: value });
    setLanguage(value);
  };

  const handleDarkModeToggle = async () => {
    const newDarkMode = !darkMode;
    await updatePreferences({ darkMode: newDarkMode });
    toggleDarkMode();
  };

  const handleUpdateRate = async () => {
    const rate = parseFloat(khrRate);
    if (isNaN(rate) || rate <= 0) {
      setError(t('settings.exchangeRate.errors.invalid_rate'));
      return;
    }

    if (rate < 3000 || rate > 5000) {
      setError(t('settings.exchangeRate.errors.unusual_rate'));
      return;
    }

    setPendingRate(rate);
    setShowConfirm(true);
  };

  const confirmUpdate = async () => {
    if (!pendingRate) return;

    setIsUpdating(true);
    setError(null);

    try {
      await updateExchangeRate(pendingRate);
      setShowConfirm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update exchange rate');
    } finally {
      setIsUpdating(false);
      setPendingRate(null);
    }
  };

  const handleAddMember = useCallback(async () => {
    const emailInput = newMemberEmail.trim();
    if (!emailInput) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setInviteFeedback({ type: 'error', message: t('settings.invite.invalid_email') || 'Please enter a valid email address' });
      return;
    }

    setIsInviting(true);
    setInviteFeedback(null);

    try {
      // normalize and store canonical lower-cased emails to keep preferences consistent
      const emailLower = emailInput.toLowerCase();
      const existing = preferences.invitedMembers || [];

      if (existing.includes(emailLower)) {
        setInviteFeedback({ type: 'error', message: t('settings.invite.already_invited', { email: emailLower }) || `${emailLower} is already invited` });
        return;
      }

      const next = [emailLower, ...existing];
      await updatePreferences({ invitedMembers: next });

      if (user) {
        await invitationService.createInvitation({
          ownerId: user.uid,
          ownerEmail: user.email || undefined,
          ownerName: user.displayName || undefined,
          inviteeEmail: emailLower,
        });
      }

      setNewMemberEmail('');
      setInviteFeedback({ type: 'success', message: t('settings.invite.sent', { email: emailLower }) || `Invite sent to ${emailLower}` });
      setError(null);

      // auto-dismiss success after a few seconds
      setTimeout(() => setInviteFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to send invite:', err);
      setInviteFeedback({ type: 'error', message: (err instanceof Error ? err.message : t('settings.invite.failed') || 'Failed to send invite') });
    } finally {
      setIsInviting(false);
    }
  }, [newMemberEmail, preferences.invitedMembers, updatePreferences, user, t]);

  const handleRemoveMember = useCallback(async (email: string) => {
    const existing = preferences.invitedMembers || [];
    const emailLower = email.toLowerCase();

    // store canonical removing key as lower-case to match stored values
    setRemovingEmail(emailLower);
    setInviteFeedback(null);

    try {
      // First try to uninvite (cancel the invitation)
      try {
        await uninviteMember(emailLower);
        setInviteFeedback({ type: 'success', message: t('settings.invite.uninvited', { email: emailLower }) || `Uninvited ${emailLower}` });
      } catch (uninviteError) {
        // If uninvite fails, just remove from preferences (fallback)
        console.warn('Uninvite failed, falling back to preference removal:', uninviteError);
        const next = existing.filter(e => e !== emailLower);
        await updatePreferences({ invitedMembers: next });
        setInviteFeedback({ type: 'success', message: t('settings.invite.removed', { email: emailLower }) || `Removed ${emailLower}` });
      }

      // auto-dismiss success after a few seconds
      setTimeout(() => setInviteFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to remove invite:', err);
      setInviteFeedback({ type: 'error', message: (err instanceof Error ? err.message : t('settings.invite.remove_failed') || 'Failed to remove invite') });
    } finally {
      setRemovingEmail(null);
    }
  }, [preferences.invitedMembers, updatePreferences, t, uninviteMember]);

  const handleUninviteConfirm = useCallback(async () => {
    if (!emailToUninvite) return;
    
    setRemovingEmail(emailToUninvite);
    setInviteFeedback(null);
    setShowUninviteConfirm(false);

    try {
      await uninviteMember(emailToUninvite);
      setInviteFeedback({ type: 'success', message: t('settings.invite.uninvited', { email: emailToUninvite }) || `Uninvited ${emailToUninvite}` });
      
      // auto-dismiss success after a few seconds
      setTimeout(() => setInviteFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to uninvite member:', err);
      setInviteFeedback({ type: 'error', message: (err instanceof Error ? err.message : t('settings.invite.uninvite_failed') || 'Failed to uninvite member') });
    } finally {
      setRemovingEmail(null);
      setEmailToUninvite(null);
    }
  }, [emailToUninvite, t, uninviteMember]);

  const handleRequestNotificationPermission = useCallback(async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setInviteFeedback({ type: 'success', message: 'Push notifications enabled!' });
      } else {
        setInviteFeedback({ type: 'error', message: 'Push notifications permission denied' });
      }
      setTimeout(() => setInviteFeedback(null), 5000);
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      setInviteFeedback({ type: 'error', message: 'Failed to enable push notifications' });
      setTimeout(() => setInviteFeedback(null), 5000);
    }
  }, [requestNotificationPermission]);

  const handleUpdateMemberPermissions = useCallback(async (memberId: string, permissions: any) => {
    setIsUpdatingPermissions(true);
    try {
      await updateMemberPermissions(memberId, permissions);
      setEditingMember(null);
      setInviteFeedback({ type: 'success', message: 'Member permissions updated successfully!' });
      setTimeout(() => setInviteFeedback(null), 5000);
    } catch (error) {
      console.error('Failed to update member permissions:', error);
      setInviteFeedback({ type: 'error', message: 'Failed to update member permissions' });
      setTimeout(() => setInviteFeedback(null), 5000);
    } finally {
      setIsUpdatingPermissions(false);
    }
  }, [updateMemberPermissions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <LoadingSpinner size="large" className="text-indigo-600" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 animate-pulse text-center">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 smooth-scroll pb-[env(safe-area-inset-bottom)]">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {t('settings.title')}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t('settings.subtitle')}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('settings.appearance.title')}
              </h2>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {t('settings.appearance.darkMode')}
                </span>
                <button
                  onClick={handleDarkModeToggle}
                  role="switch"
                  aria-checked={darkMode}
                  aria-label={t('settings.appearance.darkMode')}
                  className={`${darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 touch-manipulation mobile-button mobile-active p-1`}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <span className="sr-only">Enable dark mode</span>
                  <span
                    className={`${darkMode ? 'translate-x-5' : 'translate-x-0'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('settings.preferences.title')}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <label htmlFor="settings-currency-select" className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {t('settings.preferences.currency')}
                  </label>
                  <select
                    id="settings-currency-select"
                    name="currency"
                    value={preferences.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    autoComplete="off"
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 sm:py-2 text-gray-900 dark:text-white min-h-[44px] touch-manipulation w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <option value="USD">{t('currencies.USD')} ($)</option>
                    <option value="KHR">{t('currencies.KHR')} (៛)</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <label htmlFor="settings-language-select" className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {t('settings.preferences.language')}
                  </label>
                  <select
                    id="settings-language-select"
                    name="language"
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    autoComplete="off"
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 sm:py-2 text-gray-900 dark:text-white min-h-[44px] touch-manipulation w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="km">ខ្មែរ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Collaborators Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Collaborators
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.invite.label') || 'Invite member by email'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <input
                      id="invite-email"
                      name="inviteEmail"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder={t('settings.invite.placeholder') || 'member@example.com'}
                      inputMode="email"
                      autoComplete="off"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 sm:py-2 text-gray-900 dark:text-white min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={isInviting}
                      className={`px-4 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors duration-200 min-h-[44px] touch-manipulation mobile-button mobile-active ${isInviting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {isInviting ? (
                        <span className="inline-flex items-center gap-2">
                          <LoadingSpinner size="small" className="text-white" />
                          {t('settings.invite.sending')}
                        </span>
                      ) : (
                        t('settings.invite.button') || 'Invite'
                      )}
                    </button>
                  </div>
                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invited Members
                  </label>
                  <div className="space-y-2">
                    {(preferences.invitedMembers && preferences.invitedMembers.length > 0) ? (
                      preferences.invitedMembers.map((email) => (
                        <div key={email} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{email}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEmailToUninvite(email);
                                setShowUninviteConfirm(true);
                              }}
                              disabled={removingEmail === email}
                              className={`text-xs px-2.5 py-1.5 rounded ${removingEmail === email ? 'bg-gray-400 cursor-wait' : 'bg-orange-500 hover:bg-orange-600'} text-white min-h-[32px] touch-manipulation`}
                            >
                              Uninvite
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(email)}
                              disabled={removingEmail === email}
                              className={`text-xs px-2.5 py-1.5 rounded ${removingEmail === email ? 'bg-gray-400 cursor-wait' : 'bg-red-500 hover:bg-red-600'} text-white min-h-[32px] touch-manipulation`}
                            >
                              {removingEmail === email ? (
                                <span className="inline-flex items-center gap-2">
                                  <LoadingSpinner size="small" className="text-white" />
                                  {t('settings.invite.removing')}
                                </span>
                                ) : (
                                (t('settings.invite.remove_button') || 'Remove')
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('settings.invite.none') || 'No invited members yet'}</p>
                    )}
                    {inviteFeedback && (
                      <div className={`mt-3 text-sm ${inviteFeedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {inviteFeedback.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                    {t('settings.invite.allow_edit_label') || 'Allow invited members to edit all transactions'}
                  </span>
                  <button
                    onClick={() => updatePreferences({ allowMemberEditAllTransactions: !preferences.allowMemberEditAllTransactions })}
                    role="switch"
                    aria-checked={preferences.allowMemberEditAllTransactions}
                    aria-label={t('settings.invite.allow_edit_aria') || 'Allow invited members to edit all transactions'}
                    className={`${preferences.allowMemberEditAllTransactions ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 touch-manipulation mobile-button mobile-active p-1`}
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    <span className="sr-only">{t('settings.invite.allow_edit_sr') || 'Toggle member edit permission'}</span>
                    <span
                      className={`${preferences.allowMemberEditAllTransactions ? 'translate-x-5' : 'translate-x-0'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`}
                    />
                  </button>
                </div>

                {/* Push Notifications Section */}
                {isPushNotificationSupported && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                          Push Notifications
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Get notified about new invitations and updates
                        </p>
                      </div>
                      <button
                        onClick={handleRequestNotificationPermission}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors duration-200 min-h-[44px] touch-manipulation mobile-button mobile-active text-sm"
                      >
                        Enable
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Management Section */}
            {isOwner && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm mobile-card-hover mobile-transition">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Team Management
                </h2>
                <MemberManagement onEditMember={setEditingMember} />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm mobile-card-hover mobile-transition">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.exchangeRate.title')}
                </h2>
                {/* <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                  Auto-updates daily
                </span> */}
              </div>

              {error && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-red-700 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm sm:text-base">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 sm:p-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label htmlFor="khr-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('settings.exchangeRate.subtitle')}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="relative flex-1">
                          <input
                            id="khr-rate"
                            name="khrRate"
                            type="text"
                            value={khrRate}
                            onChange={(e) => setKhrRate(e.target.value)}
                            inputMode="decimal"
                            enterKeyHint="done"
                            step="0.01"
                            min="0"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            pattern="[0-9]*[.,]?[0-9]*"
                            className="block w-full pl-12 pr-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                              bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm 
                              focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                          />
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">KHR</span>
                          </div>
                        </div>
                        <button
                          onClick={handleUpdateRate}
                          disabled={isUpdating}
                          aria-label={t('settings.exchangeRate.update_button')}
                          className="px-4 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 
                            disabled:bg-gray-400 text-white rounded-lg shadow-sm
                            transition-colors duration-200 min-h-[44px] touch-manipulation mobile-button mobile-active focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600
                            w-full sm:w-auto sm:min-w-[120px]"
                        >
                          {isUpdating ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span className="text-sm">Updating...</span>
                            </div>
                          ) : (
                            <span className="text-sm">{t('settings.exchangeRate.update_button')}</span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('settings.exchangeRate.current_rate')} : 1 {t('currencies.USD')} = {exchangeRates.KHR_USD.toLocaleString()} {t('currencies.KHR')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {t('settings.exchangeRate.last_updated')} : {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    aria-expanded={isHistoryExpanded}
                    aria-controls="rate-history-panel"
                    className="w-full flex justify-between items-center mb-3 group min-h-[44px] touch-manipulation mobile-button mobile-active focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('settings.exchangeRate.rate_history')}
                      </h3>
                      <span className="text-xs text-gray-500">
                        ({exchangeRates.history?.length || 0} changes)
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 
                        group-hover:text-gray-700 flex-shrink-0 ${isHistoryExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div
                    id="rate-history-panel"
                    className={`space-y-2 transition-all duration-200 ${isHistoryExpanded ? 'max-h-[50vh] opacity-100 overflow-auto overscroll-contain touch-pan-y' : 'max-h-0 opacity-0 overflow-hidden'}`}
                  >
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {exchangeRates.history?.map((history, index, array) => {
                        const previousRate = array[index + 1]?.rate;
                        const rateChange = previousRate ? getRateChange(history.rate, previousRate) : null;

                        return (
                          <div
                            key={history.date}
                            className={`py-3 flex items-center justify-between ${index === 0 ? 'bg-green-50 dark:bg-green-900/10 -mx-2 px-2 rounded-lg' : ''
                              }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                                  1 USD = {history.rate.toLocaleString()} KHR
                                </span>
                                {rateChange && (
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${rateChange.isIncrease
                                      ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                                      : rateChange.isDecrease
                                        ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                                        : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30'
                                    }`}>
                                    {rateChange.isIncrease ? '↑' : rateChange.isDecrease ? '↓' : '–'}
                                    {Math.abs(parseFloat(rateChange.value))}%
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <time dateTime={history.date} className="truncate">
                                  {new Date(history.date).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </time>
                                {history.updatedBy && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 truncate">
                                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="truncate">{history.updatedBy}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {index === 0 && (
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 
                                bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                                Current
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {(!exchangeRates.history || exchangeRates.history.length === 0) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                        No rate history available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmUpdate}
        title={t('settings.exchangeRate.update_exchange_rate_title')}
        message={`${t('settings.exchangeRate.update_exchange_rate_desc')} = ${pendingRate?.toLocaleString()} ${t('currencies.KHR')}?`}
        confirmLabel={t('common.update')}
        confirmButtonClass="bg-indigo-600 hover:bg-indigo-700"
        loading={isUpdating}
      />
      
      <ConfirmDialog
        isOpen={showUninviteConfirm}
        onClose={() => {
          setShowUninviteConfirm(false);
          setEmailToUninvite(null);
        }}
        onConfirm={handleUninviteConfirm}
        title="Uninvite Member"
        message={`Are you sure you want to cancel the invitation for ${emailToUninvite}? They will be notified about the cancellation.`}
        confirmLabel="Uninvite"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        loading={removingEmail === emailToUninvite}
      />
      
      {/* Permission Editor Modal */}
      {editingMember && (
        <PermissionEditor
          member={editingMember}
          onSave={handleUpdateMemberPermissions}
          onCancel={() => setEditingMember(null)}
          isUpdating={isUpdatingPermissions}
        />
      )}
    </>
  );
};
