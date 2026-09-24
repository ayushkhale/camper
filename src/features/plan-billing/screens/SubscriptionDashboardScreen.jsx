import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Linking,
  Modal,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Star,
  X,
  Zap,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../app/providers/AuthContext';
import { api } from '../../../shared/services/api';
import { apiDebugError, apiDebugLog, shouldLogApi } from '../../../shared/services/api/client';
import CurvedHeader from '../../../shared/components/CurvedHeader';
import { COLORS } from '../../../shared/constants/colors';
import { useAlert } from '../../../app/providers/AlertContext';
import { useEntitlements } from '../../../app/providers/EntitlementContext';

// const RAZORPAY_KEY_ID = 'rzp_test_SbMjn5LrmOZKI7';
const RAZORPAY_KEY_ID = 'rzp_live_TbpvwjzvPKOiNw';
const PAYMENT_POLL_INTERVAL_MS = 3000;
const PAYMENT_POLL_MAX_ATTEMPTS = 21;
const SUPPORT_PHONE_NUMBER = '+9752050655';
const SUPPORT_PHONE_DISPLAY = '+91 97520 50655';

const getPlanList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.plans)) return response.plans;
  if (Array.isArray(response?.data?.plans)) return response.data.plans;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return null;
};

const getSubscriptionPlanVersionId = (subscription) =>
  subscription?.planVersionId ||
  subscription?.planVersion?.id ||
  subscription?.plan?.activePlanVersionId ||
  null;

const getSubscriptionPlanBaseId = (subscription) =>
  subscription?.planId ||
  subscription?.planBaseId ||
  subscription?.planVersion?.planId ||
  subscription?.plan?.id ||
  null;

const getLocalizedPlanName = (name, t) => {
  const normalizedName = String(name || '').trim().toLowerCase();

  if (!normalizedName || normalizedName === 'subscription plan') {
    return t('subscriptionBilling.defaultPlanName');
  }
  if (normalizedName === 'free plan') return t('subscriptionBilling.freePlan');
  if (normalizedName === 'free trial') return t('subscriptionBilling.freeTrial');
  if (normalizedName === 'basic plan') return t('subscriptionBilling.basicPlan');
  return name;
};

const getPlanFeatures = (version, t) => {
  const featuresList = [];
  const features = version?.features;

  if (features) {
    if (features['customer.limit'] !== undefined) {
      featuresList.push(t('subscriptionBilling.customerLimit', { count: features['customer.limit'] }));
    }
    if (features['product.limit'] !== undefined) {
      featuresList.push(t('subscriptionBilling.productLimit', { count: features['product.limit'] }));
    }
    if (features['staff.limit'] !== undefined) {
      featuresList.push(t('subscriptionBilling.staffLimit', { count: features['staff.limit'] }));
    }
    if (features['route.limit'] !== undefined) {
      featuresList.push(t('subscriptionBilling.routeLimit', { count: features['route.limit'] }));
    }
    if (features.invoicing) featuresList.push(t('subscriptionBilling.professionalInvoicing'));
    if (features['reports.analytics']) featuresList.push(t('subscriptionBilling.analyticsReports'));
    if (features.one_time_orders) featuresList.push(t('subscriptionBilling.oneTimeOrders'));
    if (features['whatsapp.reminders']) featuresList.push(t('subscriptionBilling.whatsappReminders'));
  }

  return featuresList.length > 0 ? featuresList : [t('subscriptionBilling.standardFeatures')];
};

const mapAvailablePlans = (plans, t) => plans.map((plan, index) => {
  const versions = Array.isArray(plan.versions) ? plan.versions : [];
  const configuredVersionId = plan.activePlanVersionId || plan.currentPlanVersionId;
  const configuredVersion = versions.find((version) => version.id === configuredVersionId);
  const latestVersion = versions.length > 0
    ? versions.reduce(
      (latest, version) => (version.versionNumber > latest.versionNumber ? version : latest),
      versions[0],
    )
    : null;
  const selectedVersion = configuredVersion || plan.activeVersion || latestVersion;
  const monthlyPrice = Number(selectedVersion?.monthlyPrice ?? plan.monthlyPrice ?? 0);
  const annualPrice = Number(selectedVersion?.annualPrice ?? plan.annualPrice ?? monthlyPrice);

  return {
    id: selectedVersion?.id || configuredVersionId || plan.id,
    planBaseId: plan.id,
    name: getLocalizedPlanName(plan.name, t),
    description: plan.description,
    price: Math.round(monthlyPrice),
    monthlyPrice,
    annualPrice,
    isFree: monthlyPrice <= 0 && annualPrice <= 0,
    currency: selectedVersion?.currency || plan.currency || 'INR',
    interval: t('subscriptionBilling.month'),
    features: getPlanFeatures(selectedVersion || plan, t),
    icon: index % 2 === 0 ? <Star color="#FFFFFF" size={24} /> : <Zap color="#FFFFFF" size={24} />,
    color: index % 2 === 0 ? '#3B82F6' : '#8B5CF6',
    popular: index === 1,
  };
});

const getSubscriptionStatusMeta = (status, t) => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'active') {
    return {
      title: t('subscriptionBilling.activeSubscription'),
      label: t('subscriptionBilling.active'),
      color: '#16A34A',
      backgroundColor: '#DCFCE7',
      icon: ShieldCheck,
    };
  }

  if (['trial', 'trialing'].includes(normalizedStatus)) {
    return {
      title: t('subscriptionBilling.freeTrial'),
      label: t('subscriptionBilling.trialActive'),
      color: '#2563EB',
      backgroundColor: '#DBEAFE',
      icon: ShieldCheck,
    };
  }

  if (['pending_payment', 'authenticated', 'created'].includes(normalizedStatus)) {
    return {
      title: t('subscriptionBilling.paymentPending'),
      label: normalizedStatus === 'authenticated'
        ? t('subscriptionBilling.activating')
        : t('subscriptionBilling.pendingPayment'),
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      icon: Clock,
    };
  }

  if (['past_due', 'halted'].includes(normalizedStatus)) {
    return {
      title: t('subscriptionBilling.paymentAttentionRequired'),
      label: t('subscriptionBilling.pastDue'),
      color: '#DC2626',
      backgroundColor: '#FEE2E2',
      icon: CreditCard,
    };
  }

  if (['cancelled', 'canceled', 'expired'].includes(normalizedStatus)) {
    return {
      title: t('subscriptionBilling.subscriptionEnded'),
      label: normalizedStatus === 'expired'
        ? t('subscriptionBilling.expired')
        : t('subscriptionBilling.cancelled'),
      color: '#DC2626',
      backgroundColor: '#FEE2E2',
      icon: CreditCard,
    };
  }

  return {
    title: t('subscriptionBilling.subscription'),
    label: t('subscriptionBilling.unknown'),
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    icon: CreditCard,
  };
};

const getPaymentStatusMeta = (status, t) => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (['paid', 'captured', 'success', 'successful'].includes(normalizedStatus)) {
    return {
      label: t('subscriptionBilling.paymentSuccessful'),
      color: '#15803D',
      backgroundColor: '#DCFCE7',
    };
  }

  if (['failed', 'error'].includes(normalizedStatus)) {
    return {
      label: t('subscriptionBilling.paymentFailed'),
      color: '#B91C1C',
      backgroundColor: '#FEE2E2',
    };
  }

  if (normalizedStatus === 'refunded') {
    return {
      label: t('subscriptionBilling.paymentRefunded'),
      color: '#6D28D9',
      backgroundColor: '#EDE9FE',
    };
  }

  return {
    label: normalizedStatus === 'authorized'
      ? t('subscriptionBilling.paymentAuthorized')
      : t('subscriptionBilling.paymentPending'),
    color: '#B45309',
    backgroundColor: '#FEF3C7',
  };
};


const SubscriptionDashboardScreen = ({ navigation, route }) => {
  const { userToken, user } = useContext(AuthContext);
  const { showAlert } = useAlert();
  const { refreshEntitlements } = useEntitlements();
  const { t, i18n } = useTranslation();
  const showAlertRef = useRef(showAlert);
  const activationSuccessTimerRef = useRef(null);
  const screenMountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [paymentVerification, setPaymentVerification] = useState(null);
  const [activationModalState, setActivationModalState] = useState(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentSummaryVisible, setPaymentSummaryVisible] = useState(false);
  const [paymentSummaryLoading, setPaymentSummaryLoading] = useState(false);
  const [paymentSummaryError, setPaymentSummaryError] = useState('');
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [subscriptionPayments, setSubscriptionPayments] = useState([]);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [paymentFailurePlan, setPaymentFailurePlan] = useState(null);
  const waitingForPayment = paymentVerification !== null;

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  useEffect(() => {
    screenMountedRef.current = true;

    return () => {
      screenMountedRef.current = false;
      if (activationSuccessTimerRef.current) {
        clearTimeout(activationSuccessTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!paymentSummaryVisible) return undefined;

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setPaymentSummaryVisible(false);
      return true;
    });

    return () => backSubscription.remove();
  }, [paymentSummaryVisible]);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, plansRes] = await Promise.all([
        api.getSubscriptionStatus(userToken, user?.vendorAccountId || 'me').catch(() => ({ error: true })),
        api.getActivePlans(userToken).catch((error) => {
          apiDebugLog('[Subscription] Available plans request failed:', error.message);
          return null;
        }),
      ]);

      if (shouldLogApi()) apiDebugLog('[Subscription] Active plan response:', JSON.stringify(statusRes, null, 2));

      const activePlans = getPlanList(plansRes);
      const subscription = statusRes?.data || statusRes;

      if (subscription && !subscription.error && subscription.status) {
        const matchedPlan = Array.isArray(activePlans)
          ? activePlans.find((plan) =>
            plan.id === subscription.planVersion?.planId ||
            plan.versions?.some((version) => version.id === subscription.planVersionId),
          )
          : null;
        const isTrial = String(subscription.status).toLowerCase().includes('trial');

        setActiveSubscription({
          ...subscription,
          planVersionId: getSubscriptionPlanVersionId(subscription),
          planBaseId: getSubscriptionPlanBaseId(subscription),
          planName: getLocalizedPlanName(
            subscription.planName ||
            subscription.plan?.name ||
            subscription.planVersion?.plan?.name ||
            matchedPlan?.name ||
            (isTrial ? 'Free Trial' : 'Subscription Plan'),
            t,
          ),
        });
      } else {
        setActiveSubscription(null);
      }

      if (activePlans) {
        setAvailablePlans(mapAvailablePlans(activePlans, t));
      }
    } catch (error) {
      apiDebugLog('Error fetching subscription data:', error.message);
      setActiveSubscription(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user?.vendorAccountId, userToken]);

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.refreshCurrentPlanAt) {
        apiDebugLog('[Subscription] Refreshing current plan after View Plans navigation.');
      }
      fetchData();
    }, [fetchData, route?.params?.refreshCurrentPlanAt]),
  );

  useEffect(() => {
    if (!paymentVerification) return undefined;

    let requestInFlight = false;
    let attempts = 0;
    let nextCheckTimerId;
    let cancelled = false;
    let verificationStopped = false;

    const stopVerification = () => {
      verificationStopped = true;
      if (nextCheckTimerId) clearTimeout(nextCheckTimerId);
      if (!cancelled) setPaymentVerification(null);
    };

    const matchesPaidSubscription = (subscription) => Boolean(
      subscription && (
        (paymentVerification.localSubscriptionId && subscription.id === paymentVerification.localSubscriptionId) ||
        (paymentVerification.razorpaySubscriptionId &&
          subscription.razorpaySubscriptionId === paymentVerification.razorpaySubscriptionId)
      )
    );

    const checkPaymentStatus = async () => {
      if (requestInFlight || cancelled || verificationStopped) return;
      requestInFlight = true;
      attempts += 1;

      try {
        // The customer-level status API can keep returning the previous active plan
        // while a replacement is being activated. Query the newly created local
        // subscription directly as well, so verification follows the paid checkout.
        const [currentStatusResult, paidSubscriptionResult] = await Promise.allSettled([
          api.getSubscriptionStatus(userToken, user?.vendorAccountId || 'me'),
          paymentVerification.localSubscriptionId
            ? api.getSubscriptionPayments(userToken, paymentVerification.localSubscriptionId)
            : Promise.resolve(null),
        ]);

        const currentStatusResponse = currentStatusResult.status === 'fulfilled'
          ? currentStatusResult.value
          : null;
        const currentSubscription = currentStatusResponse?.data || currentStatusResponse;
        const paidSubscriptionResponse = paidSubscriptionResult.status === 'fulfilled'
          ? paidSubscriptionResult.value
          : null;
        const paidSubscriptionPayload = paidSubscriptionResponse?.data || paidSubscriptionResponse;
        const paidSubscription =
          paidSubscriptionPayload?.subscription ||
          paidSubscriptionPayload?.data?.subscription ||
          null;
        const subscription = matchesPaidSubscription(paidSubscription)
          ? paidSubscription
          : matchesPaidSubscription(currentSubscription)
            ? currentSubscription
            : null;
        const status = String(subscription?.status || '').toLowerCase();

        apiDebugLog('[Razorpay SDK] Subscription activation check:', {
          attempt: attempts,
          maxAttempts: PAYMENT_POLL_MAX_ATTEMPTS,
          paymentId: paymentVerification.paymentId,
          localSubscriptionId: paymentVerification.localSubscriptionId,
          subscriptionId: subscription?.id,
          razorpaySubscriptionId: subscription?.razorpaySubscriptionId,
          customerStatusSubscriptionId: currentSubscription?.id,
          paidSubscriptionFound: Boolean(paidSubscription),
          expectedSubscriptionMatched: Boolean(subscription),
          status,
        });

        if (!subscription) {
          apiDebugLog('[Razorpay SDK] Ignoring the previous plan and waiting for the paid subscription record.');
        }

        if (subscription) {
          const activatedPlanVersionId =
            getSubscriptionPlanVersionId(subscription) || paymentVerification.planVersionId;
          const activatedPlanBaseId =
            getSubscriptionPlanBaseId(subscription) || paymentVerification.planBaseId;

          setActiveSubscription({
            ...subscription,
            planVersionId: activatedPlanVersionId,
            planBaseId: activatedPlanBaseId,
            planName: getLocalizedPlanName(
              subscription.planName || paymentVerification.planName || 'Subscription Plan',
              t,
            ),
          });

          if (['active', 'trial', 'trialing'].includes(status)) {
            stopVerification();
            try {
              // Prefer the inline newToken the backend embeds in the status
              // response after activation — no extra /auth/refresh round-trip.
              const inlineToken =
                currentStatusResponse?.newToken ||
                currentStatusResponse?.data?.newToken ||
                paidSubscriptionResponse?.newToken ||
                paidSubscriptionResponse?.data?.newToken ||
                null;
              if (inlineToken) {
                apiDebugLog('[Subscription] Activation newToken was applied by the subscription API client.');
              } else {
                apiDebugLog('[Subscription] No inline newToken — falling back to refreshEntitlements().');
                await refreshEntitlements();
              }
              if (screenMountedRef.current) setActivationModalState('success');
            } catch (error) {
              apiDebugLog('[Subscription] Token refresh after activation failed:', error.message);
              if (screenMountedRef.current) {
                setActivationModalState(null);
                showAlertRef.current(
                  t('subscriptionBilling.activeSubscription'),
                  t('subscriptionBilling.activationDelayed'),
                  'info',
                );
              }
            }

            // Refresh only the catalog here. The exact purchased subscription above
            // remains the source of truth, so a stale customer-status response cannot
            // replace it with the previous plan.
            api.getActivePlans(userToken)
              .then((plansResponse) => {
                const refreshedPlans = getPlanList(plansResponse);
                if (screenMountedRef.current && refreshedPlans) {
                  setAvailablePlans(mapAvailablePlans(refreshedPlans, t));
                }
              })
              .catch((error) => {
                apiDebugLog('[Subscription] Post-activation plans refresh failed:', error.message);
              });

            activationSuccessTimerRef.current = setTimeout(() => {
              setActivationModalState(null);
              activationSuccessTimerRef.current = null;
            }, 1800);
            return;
          }

          if (['past_due', 'cancelled', 'canceled', 'expired', 'halted'].includes(status)) {
            stopVerification();
            setActivationModalState(null);
            showAlertRef.current(
              t('subscriptionBilling.paymentUnsuccessful'),
              t('subscriptionBilling.activationFailed'),
              'error',
            );
            return;
          }
        }
      } catch (error) {
        apiDebugLog('[Subscription] Payment status check failed:', error.message);
      } finally {
        requestInFlight = false;
      }

      if (cancelled || verificationStopped) return;

      if (attempts >= PAYMENT_POLL_MAX_ATTEMPTS) {
        stopVerification();
        setActivationModalState(null);
        showAlertRef.current(
          t('subscriptionBilling.paymentProcessing'),
          t('subscriptionBilling.activationDelayed'),
          'info',
        );
        return;
      }

      nextCheckTimerId = setTimeout(checkPaymentStatus, PAYMENT_POLL_INTERVAL_MS);
    };

    checkPaymentStatus();

    return () => {
      cancelled = true;
      clearTimeout(nextCheckTimerId);
    };
  }, [paymentVerification, refreshEntitlements, t, user?.vendorAccountId, userToken]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (value, formattedValue, currency = 'INR') => {
    const numericValue = Number(value || 0);
    const displayValue = formattedValue !== undefined && formattedValue !== null
      ? String(formattedValue)
      : numericValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    if (/^[₹$€£]/.test(displayValue) || /^[A-Z]{3}\s/.test(displayValue)) {
      return displayValue;
    }
    return currency === 'INR' ? `₹${displayValue}` : `${currency} ${displayValue}`;
  };

  const loadPaymentSummary = async () => {
    if (!activeSubscription?.id) {
      showAlert(
        t('subscriptionBilling.summaryUnavailable'),
        t('subscriptionBilling.summaryUnavailableMessage'),
        'info',
      );
      return;
    }

    setPaymentSummaryLoading(true);
    setPaymentSummaryError('');

    try {
      const response = await api.getSubscriptionPayments(userToken, activeSubscription.id);
      const responseData = response?.data || response;
      const payload = responseData?.data && (
        responseData.data.subscription ||
        responseData.data.payments ||
        responseData.data.summary
      )
        ? responseData.data
        : responseData;
      const payments = Array.isArray(payload?.payments) ? payload.payments : [];

      setPaymentSummary(payload?.summary || {});
      setSubscriptionPayments(payments);

      if (payload?.subscription?.status) {
        setActiveSubscription((currentSubscription) => ({
          ...currentSubscription,
          ...payload.subscription,
          planVersionId:
            getSubscriptionPlanVersionId(payload.subscription) ||
            getSubscriptionPlanVersionId(currentSubscription),
          planBaseId:
            getSubscriptionPlanBaseId(payload.subscription) ||
            getSubscriptionPlanBaseId(currentSubscription),
          planName: currentSubscription?.planName || t('subscriptionBilling.defaultPlanName'),
        }));
      }
    } catch (error) {
      apiDebugLog('[Subscription] Payment summary load failed:', error.message);
      if (error.isPlanLimit) {
        setPaymentSummaryVisible(false);
      } else {
        setPaymentSummaryError(t('subscriptionBilling.paymentHistoryLoadError'));
      }
    } finally {
      setPaymentSummaryLoading(false);
    }
  };

  const handleOpenPaymentSummary = () => {
    setPaymentSummaryVisible(true);
    loadPaymentSummary();
  };

  const performSubscriptionCancellation = async () => {
    if (!activeSubscription?.id || cancellingSubscription) return;

    setCancellingSubscription(true);
    try {
      const cancelResponse = await api.cancelSubscriptionPlan(userToken, activeSubscription.id, {
        cancelAtPeriodEnd: true,
      });

      // The subscription API client applies the backend-supplied newToken
      // before this handler continues.
      const cancelToken =
        cancelResponse?.newToken ||
        cancelResponse?.data?.newToken ||
        null;
      if (cancelToken) {
        apiDebugLog('[Subscription] Cancellation newToken was applied by the subscription API client.');
      }

      await fetchData();
      setActiveSubscription((currentSubscription) => currentSubscription
        ? { ...currentSubscription, cancelAtPeriodEnd: true }
        : currentSubscription);
      showAlert(
        t('subscriptionBilling.cancellationScheduledTitle'),
        t('subscriptionBilling.cancellationScheduledMessage'),
        'success',
      );
    } catch (error) {
      apiDebugLog('[Subscription] Cancellation failed:', error.message);
      if (!error.isPlanLimit) {
        const currentLanguage = i18n.resolvedLanguage || i18n.language;
        showAlert(
          t('subscriptionBilling.cancellationFailedTitle'),
          currentLanguage?.startsWith('hi')
            ? t('subscriptionBilling.cancellationFailedMessage')
            : error?.message || t('subscriptionBilling.cancellationFailedMessage'),
          'error',
        );
      }
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleCancelSubscription = () => {
    showAlert(
      t('subscriptionBilling.cancelSubscription'),
      t('subscriptionBilling.cancelSubscriptionConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('subscriptionBilling.confirmCancellation'),
          style: 'destructive',
          onPress: performSubscriptionCancellation,
        },
      ],
    );
  };

  const handleCheckout = async (plan) => {
    setPaymentFailurePlan(null);
    setCheckoutLoadingId(plan.id);
    setPaymentVerification(null);
    setActivationModalState(null);
    if (activationSuccessTimerRef.current) {
      clearTimeout(activationSuccessTimerRef.current);
      activationSuccessTimerRef.current = null;
    }
    let checkoutStage = 'create_subscription';

    try {
      const payload = {
        customerId: user?.vendorAccountId || 'me',
        planVersionId: plan.id,
        billingCycle,
      };

      apiDebugLog('[Razorpay SDK] Creating subscription checkout:', {
        customerId: payload.customerId,
        planVersionId: payload.planVersionId,
        billingCycle: payload.billingCycle,
      });

      const res = await api.checkoutSubscription(userToken, payload);

      const checkoutData = res?.data || res;
      const localSubscription = checkoutData?.localSubscription;
      const localSubscriptionId = localSubscription?.id;
      const razorpaySubscription = checkoutData?.rzpSubscription;
      const razorpaySubscriptionId =
        razorpaySubscription?.id ||
        checkoutData?.razorpaySubscriptionId ||
        checkoutData?.localSubscription?.razorpaySubscriptionId;
      const razorpayKeyId =
        checkoutData?.razorpayKeyId ||
        checkoutData?.keyId ||
        checkoutData?.key_id ||
        razorpaySubscription?.keyId ||
        razorpaySubscription?.key_id ||
        RAZORPAY_KEY_ID;

      apiDebugLog('[Razorpay SDK] Checkout configuration received:', {
        localSubscriptionId,
        razorpaySubscriptionId,
        keyConfigured: Boolean(razorpayKeyId),
        shortUrlAvailable: Boolean(razorpaySubscription?.short_url),
      });

      if (!razorpaySubscriptionId) {
        throw new Error(t('subscriptionBilling.missingSubscriptionId'));
      }
      if (!razorpayKeyId) {
        throw new Error(t('subscriptionBilling.missingKeyId'));
      }

      const options = {
        key: razorpayKeyId,
        subscription_id: razorpaySubscriptionId,
        name: user?.businessName || 'Camper App',
        description: t('subscriptionBilling.checkoutDescription', {
          planName: plan.name,
          billingCycle: billingCycle === 'annual'
            ? t('subscriptionBilling.annual')
            : t('subscriptionBilling.monthly'),
        }),
        currency: plan.currency,
        prefill: {
          name: user?.ownerName || user?.name || '',
          email: user?.email || '',
          contact: user?.phone || user?.phoneNumber || '',
        },
        theme: { color: COLORS.primary },
      };

      checkoutStage = 'open_native_checkout';
      apiDebugLog('[Razorpay SDK] Opening native checkout:', {
        razorpaySubscriptionId,
        planVersionId: plan.id,
        currency: plan.currency,
        keyConfigured: true,
        checkoutMode: 'subscription',
        paymentMethodFiltering: 'razorpay_account_defaults',
      });

      const paymentResult = await RazorpayCheckout.open(options);
      const paymentId = paymentResult?.razorpay_payment_id;
      const successfulSubscriptionId = paymentResult?.razorpay_subscription_id || razorpaySubscriptionId;

      if (!paymentId || !successfulSubscriptionId) {
        throw new Error(t('subscriptionBilling.invalidPaymentResponse'));
      }

      apiDebugLog('[Razorpay SDK] Payment authorization succeeded:', {
        razorpayPaymentId: paymentId,
        razorpaySubscriptionId: successfulSubscriptionId,
        signatureReceived: Boolean(paymentResult?.razorpay_signature),
      });

      checkoutStage = 'confirm_subscription';
      // Polling starts only after Razorpay resolves with a valid success result.
      setActivationModalState('verifying');
      setActiveSubscription({
        ...localSubscription,
        id: localSubscriptionId,
        planVersionId: localSubscription?.planVersionId || plan.id,
        planBaseId: getSubscriptionPlanBaseId(localSubscription) || plan.planBaseId,
        razorpaySubscriptionId: successfulSubscriptionId,
        status: localSubscription?.status || 'pending_payment',
        planName: localSubscription?.planName || plan.name,
      });
      setPaymentVerification({
        paymentId,
        localSubscriptionId,
        razorpaySubscriptionId: successfulSubscriptionId,
        planVersionId: plan.id,
        planBaseId: plan.planBaseId,
        planName: plan.name,
      });
    } catch (error) {
      apiDebugError('[Razorpay SDK] Checkout failed:', {
        stage: checkoutStage,
        code: error?.code,
        description: error?.description,
        message: error?.message,
      });
      setPaymentVerification(null);
      setActivationModalState(null);

      if (!error.isPlanLimit) {
        apiDebugLog('[Razorpay SDK] Payment failure modal opened:', {
          planVersionId: plan.id,
        });
        setPaymentFailurePlan(plan);
      }
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  const handleRetryPayment = () => {
    const planToRetry = paymentFailurePlan;
    setPaymentFailurePlan(null);
    if (planToRetry) {
      handleCheckout(planToRetry);
    }
  };

  const handleCallSupport = async () => {
    try {
      await Linking.openURL(`tel:${SUPPORT_PHONE_NUMBER}`);
    } catch (error) {
      apiDebugLog('[Subscription] Could not open support dialer:', error.message);
    }
  };

  const renderActivePlan = () => {
    if (!activeSubscription) return null;
    const statusMeta = getSubscriptionStatusMeta(activeSubscription.status, t);
    const StatusIcon = statusMeta.icon;
    const periodEnd = activeSubscription.currentPeriodEnd || activeSubscription.expiryDate;
    const currentLanguage = i18n.resolvedLanguage || i18n.language;
    const dateLocale = currentLanguage?.startsWith('hi') ? 'hi-IN' : 'en-IN';
    const normalizedStatus = String(activeSubscription.status || '').toLowerCase();
    const canCancelSubscription = [
      'active',
      'trial',
      'trialing',
      'pending_payment',
      'authenticated',
    ].includes(normalizedStatus) && !activeSubscription.cancelAtPeriodEnd;

    return (
      <View style={[styles.activePlanCard, { borderLeftColor: statusMeta.color }]}>
        <View style={styles.activePlanHeader}>
          <View style={styles.activePlanHeaderInfo}>
            <View style={[styles.activePlanIcon, { backgroundColor: statusMeta.backgroundColor }]}>
              <StatusIcon color={statusMeta.color} size={22} />
            </View>
            <Text style={[styles.activePlanTitle, { color: statusMeta.color }]}>{statusMeta.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.summaryButton}
            onPress={handleOpenPaymentSummary}
            activeOpacity={0.75}
          >
            <Text style={styles.summaryButtonText}>{t('subscriptionBilling.viewSummary')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.activePlanName}>
          {getLocalizedPlanName(activeSubscription.planName || 'Free Trial', t)}
        </Text>

        <View style={styles.activePlanRow}>
          <Clock color={COLORS.textSecondary} size={16} />
          <Text style={styles.activePlanDetails}>
            {t('subscriptionBilling.status')}{' '}
            <Text style={[styles.statusValue, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </Text>
        </View>

        {!!activeSubscription.billingCycle && (
          <View style={styles.activePlanRow}>
            <CreditCard color={COLORS.textSecondary} size={16} />
            <Text style={styles.activePlanDetails}>
              {t('subscriptionBilling.billingCycle')}:{' '}
              <Text style={styles.activePlanBillingCycle}>
                {activeSubscription.billingCycle === 'annual'
                  ? t('subscriptionBilling.annual')
                  : t('subscriptionBilling.monthly')}
              </Text>
            </Text>
          </View>
        )}

        {periodEnd && (
          <View style={styles.activePlanRow}>
            <CreditCard color={COLORS.textSecondary} size={16} />
            <Text style={styles.activePlanDetails}>
              {t('subscriptionBilling.currentPeriodEnds', {
                date: new Date(periodEnd).toLocaleDateString(dateLocale),
              })}
            </Text>
          </View>
        )}

        {activeSubscription.cancelAtPeriodEnd ? (
          <View style={styles.cancellationScheduledPill}>
            <Clock color="#B45309" size={15} />
            <Text style={styles.cancellationScheduledText}>
              {t('subscriptionBilling.cancellationScheduled')}
            </Text>
          </View>
        ) : canCancelSubscription ? (
          <TouchableOpacity
            style={styles.cancelSubscriptionButton}
            onPress={handleCancelSubscription}
            disabled={cancellingSubscription}
            activeOpacity={0.75}
          >
            {cancellingSubscription ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.cancelSubscriptionButtonText}>
                {t('subscriptionBilling.cancelSubscription')}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderPlans = () => {
    const activePlanVersionId = getSubscriptionPlanVersionId(activeSubscription);
    const activePlanBaseId = getSubscriptionPlanBaseId(activeSubscription);
    const planMatchesSubscription = (plan) =>
      (activePlanVersionId && plan.id === activePlanVersionId) ||
      (activePlanBaseId && plan.planBaseId === activePlanBaseId);
    const currentPlanIsListed = availablePlans.some(planMatchesSubscription);
    const fallbackCurrentPlan = activeSubscription && !currentPlanIsListed
      ? {
        id: activePlanVersionId || activeSubscription.id || 'current-subscription',
        planBaseId: activePlanBaseId,
        name: getLocalizedPlanName(activeSubscription.planName || 'Subscription Plan', t),
        description: t('subscriptionBilling.currentSubscriptionDescription'),
        price: Math.round(Number(activeSubscription.planVersion?.monthlyPrice || 0)),
        monthlyPrice: Number(activeSubscription.planVersion?.monthlyPrice || 0),
        annualPrice: Number(
          activeSubscription.planVersion?.annualPrice ??
          activeSubscription.planVersion?.monthlyPrice ??
          0,
        ),
        isFree:
          Number(activeSubscription.planVersion?.monthlyPrice || 0) <= 0 &&
          Number(activeSubscription.planVersion?.annualPrice || 0) <= 0,
        currency: activeSubscription.planVersion?.currency || 'INR',
        interval: t('subscriptionBilling.month'),
        features: getPlanFeatures(activeSubscription.planVersion, t),
        icon: <ShieldCheck color="#FFFFFF" size={24} />,
        color: '#16A34A',
        popular: false,
      }
      : null;
    const displayedPlans = fallbackCurrentPlan
      ? [fallbackCurrentPlan, ...availablePlans]
      : [...availablePlans].sort((firstPlan, secondPlan) =>
        Number(planMatchesSubscription(secondPlan)) - Number(planMatchesSubscription(firstPlan)),
      );

    return displayedPlans.map((plan) => {
      const isCurrentPlan = planMatchesSubscription(plan);
      const currentStatus = String(activeSubscription?.status || '').toLowerCase();
      const isCurrentActive = isCurrentPlan && ['active', 'trial', 'trialing'].includes(currentStatus);
      const isCurrentPending = isCurrentPlan && ['pending_payment', 'authenticated', 'created'].includes(currentStatus);
      const selectedPrice = billingCycle === 'annual'
        ? plan.annualPrice
        : plan.monthlyPrice;
      const displayedPrice = Math.round(Number(selectedPrice ?? plan.price ?? 0));
      const isSelectedCycleFree = Number(selectedPrice ?? plan.price ?? 0) <= 0;
      const buttonDisabled = checkoutLoadingId !== null || waitingForPayment || isCurrentActive;
      const buttonLabel = isCurrentActive
        ? t('subscriptionBilling.currentPlan')
        : isCurrentPending
          ? t('subscriptionBilling.retryPayment')
          : isSelectedCycleFree
            ? t('subscriptionBilling.chooseFreePlan')
            : t('subscriptionBilling.buyNow');

      return (
        <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular, isCurrentPlan && styles.currentPlanCard]}>
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>{t('subscriptionBilling.mostPopular')}</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <View style={[styles.planIconWrapper, { backgroundColor: plan.color }]}>
              {plan.icon}
            </View>
            <View style={styles.planTitleWrapper}>
              <Text style={styles.planName}>{plan.name}</Text>
              {!!plan.description && <Text style={styles.planDescription}>{plan.description}</Text>}
              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>{'\u20B9'}</Text>
                <Text style={styles.priceAmount}>{displayedPrice}</Text>
                <Text style={styles.priceInterval}>
                  /{billingCycle === 'annual'
                    ? t('subscriptionBilling.year')
                    : t('subscriptionBilling.month')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.featuresList}>
            {plan.features.map((feature, idx) => (
              <View key={idx} style={styles.featureRow}>
                <View style={[styles.checkCircle, { backgroundColor: plan.color + '20' }]}>
                  <Check color={plan.color} size={14} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.buyButton, { backgroundColor: plan.color }, buttonDisabled && styles.buyButtonDisabled]}
            onPress={() => handleCheckout(plan)}
            disabled={buttonDisabled}
          >
            {checkoutLoadingId === plan.id ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buyButtonText}>
                {buttonLabel}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    });
  };

  const activationPlanName = getLocalizedPlanName(
    paymentVerification?.planName || activeSubscription?.planName || t('subscriptionBilling.yourPlan'),
    t,
  );
  const summaryCurrency = paymentSummary?.currency || activeSubscription?.planVersion?.currency || 'INR';
  const summaryTotalPaid =
    paymentSummary?.totalPaid ??
    paymentSummary?.total_amount_paid ??
    paymentSummary?.amountPaid ??
    0;
  const summaryTotalPaidFormatted =
    paymentSummary?.totalPaidFormatted ??
    paymentSummary?.total_amount_paid_formatted ??
    paymentSummary?.amountPaidFormatted;
  const successfulPaymentsCount =
    paymentSummary?.successfulPaymentCount ??
    paymentSummary?.successfulCount ??
    paymentSummary?.paidCount ??
    subscriptionPayments.filter((payment) =>
      ['paid', 'captured', 'success', 'successful'].includes(String(payment.status || '').toLowerCase()),
    ).length;

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={t('subscriptionBilling.title')}
        leftIcon={<ArrowLeft size={24} color="#FFFFFF" />}
        onLeftPress={() => navigation.goBack()}
        height={120}
        contentStyle={{ paddingTop: 10, paddingBottom: 25 }}
      />

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {renderActivePlan()}

          <Text style={styles.sectionTitle}>{t('subscriptionBilling.availablePlans')}</Text>
          <Text style={styles.sectionSubtitle}>{t('subscriptionBilling.choosePlanSubtitle')}</Text>

          <View style={styles.billingCycleSelector}>
            <TouchableOpacity
              style={[
                styles.billingCycleOption,
                billingCycle === 'monthly' && styles.billingCycleOptionActive,
              ]}
              onPress={() => setBillingCycle('monthly')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.billingCycleOptionText,
                  billingCycle === 'monthly' && styles.billingCycleOptionTextActive,
                ]}
              >
                {t('subscriptionBilling.monthly')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.billingCycleOption,
                billingCycle === 'annual' && styles.billingCycleOptionActive,
              ]}
              onPress={() => setBillingCycle('annual')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.billingCycleOptionText,
                  billingCycle === 'annual' && styles.billingCycleOptionTextActive,
                ]}
              >
                {t('subscriptionBilling.annual')}
              </Text>
            </TouchableOpacity>
          </View>

          {renderPlans()}

          <View style={styles.scrollSpacer} />
        </ScrollView>
      )}

      <Modal
        visible={Boolean(paymentFailurePlan)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPaymentFailurePlan(null)}
      >
        <View style={styles.paymentFailureOverlay}>
          <View style={styles.paymentFailureModal}>
            <View style={styles.paymentFailureAccent} />
            <View style={styles.paymentFailureGlowTop} />
            <View style={styles.paymentFailureGlowBottom} />

            <TouchableOpacity
              style={styles.paymentFailureCloseButton}
              onPress={() => setPaymentFailurePlan(null)}
              activeOpacity={0.75}
              accessibilityLabel={t('subscriptionBilling.closePaymentHelp')}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.paymentFailureIconRing}>
              <View style={styles.paymentFailureIconCore}>
                <AlertTriangle size={36} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>

            <View style={styles.paymentFailureBadge}>
              <ShieldCheck size={14} color="#B45309" />
              <Text style={styles.paymentFailureBadgeText}>
                {t('subscriptionBilling.paymentHelp')}
              </Text>
            </View>

            <Text style={styles.paymentFailureTitle}>
              {t('subscriptionBilling.paymentIssueTitle')}
            </Text>
            <Text style={styles.paymentFailureMessage}>
              {t('subscriptionBilling.paymentIssueMessage')}
            </Text>

            <TouchableOpacity
              style={styles.paymentSupportCard}
              onPress={handleCallSupport}
              activeOpacity={0.8}
            >
              <View style={styles.paymentSupportIcon}>
                <PhoneCall size={20} color={COLORS.primary} />
              </View>
              <View style={styles.paymentSupportDetails}>
                <Text style={styles.paymentSupportLabel}>
                  {t('subscriptionBilling.contactSupport')}
                </Text>
                <Text style={styles.paymentSupportNumber}>{SUPPORT_PHONE_DISPLAY}</Text>
              </View>
              <Text style={styles.paymentSupportCallText}>
                {t('subscriptionBilling.callNow')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentRetryButton}
              onPress={handleRetryPayment}
              activeOpacity={0.85}
            >
              <RefreshCw size={19} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.paymentRetryButtonText}>
                {t('subscriptionBilling.retryAgain')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {paymentSummaryVisible && (
        <View style={styles.paymentSummaryOverlay}>
          <View style={styles.paymentSummaryCard}>
            <View style={styles.paymentSummaryHeader}>
              <View style={styles.paymentSummaryHeaderInfo}>
                <View style={styles.paymentSummaryHeaderIcon}>
                  <CreditCard color={COLORS.primary} size={22} />
                </View>
                <View style={styles.paymentSummaryHeaderText}>
                  <Text style={styles.paymentSummaryTitle}>
                    {t('subscriptionBilling.paymentSummary')}
                  </Text>
                  <Text style={styles.paymentSummarySubtitle} numberOfLines={1}>
                    {activeSubscription?.planName || t('subscriptionBilling.defaultPlanName')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.paymentSummaryCloseButton}
                onPress={() => setPaymentSummaryVisible(false)}
                activeOpacity={0.75}
              >
                <X color={COLORS.textSecondary} size={22} />
              </TouchableOpacity>
            </View>

            {paymentSummaryLoading ? (
              <View style={styles.paymentSummaryLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.paymentSummaryLoadingText}>
                  {t('subscriptionBilling.loadingPaymentHistory')}
                </Text>
              </View>
            ) : paymentSummaryError ? (
              <View style={styles.paymentSummaryLoading}>
                <Text style={styles.paymentSummaryErrorText}>{paymentSummaryError}</Text>
                <TouchableOpacity style={styles.paymentSummaryRetryButton} onPress={loadPaymentSummary}>
                  <Text style={styles.paymentSummaryRetryText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.paymentSummaryScroll}
                contentContainerStyle={styles.paymentSummaryScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.paymentTotalCard}>
                  <Text style={styles.paymentTotalLabel}>{t('subscriptionBilling.totalPaid')}</Text>
                  <Text style={styles.paymentTotalValue}>
                    {formatCurrency(summaryTotalPaid, summaryTotalPaidFormatted, summaryCurrency)}
                  </Text>
                  <Text style={styles.paymentTotalCaption}>
                    {t('subscriptionBilling.successfulPaymentsCount', {
                      count: successfulPaymentsCount,
                    })}
                  </Text>
                </View>

                <Text style={styles.paymentHistoryTitle}>
                  {t('subscriptionBilling.paymentHistory')}
                </Text>

                {subscriptionPayments.length === 0 ? (
                  <View style={styles.paymentHistoryEmpty}>
                    <CreditCard color="#94A3B8" size={28} />
                    <Text style={styles.paymentHistoryEmptyText}>
                      {t('subscriptionBilling.noPaymentsFound')}
                    </Text>
                  </View>
                ) : (
                  subscriptionPayments.map((payment, index) => {
                    const paymentStatus = getPaymentStatusMeta(payment.status, t);
                    const paymentDate = payment.paidAt || payment.createdAt || payment.created_at;
                    const paymentCurrency = payment.currency || summaryCurrency;
                    const paymentAmount = payment.amountPaid ?? payment.amount ?? payment.total ?? 0;
                    const paymentAmountFormatted = payment.amountPaidFormatted || payment.amountFormatted;
                    const paymentId =
                      payment.razorpayPaymentId ||
                      payment.razorpay_payment_id ||
                      payment.id;

                    return (
                      <View key={paymentId || index} style={styles.paymentHistoryItem}>
                        <View style={styles.paymentHistoryItemTop}>
                          <Text style={styles.paymentHistoryAmount}>
                            {formatCurrency(paymentAmount, paymentAmountFormatted, paymentCurrency)}
                          </Text>
                          <View
                            style={[
                              styles.paymentHistoryStatus,
                              { backgroundColor: paymentStatus.backgroundColor },
                            ]}
                          >
                            <Text style={[styles.paymentHistoryStatusText, { color: paymentStatus.color }]}>
                              {paymentStatus.label}
                            </Text>
                          </View>
                        </View>
                        {!!paymentDate && (
                          <Text style={styles.paymentHistoryDate}>
                            {new Date(paymentDate).toLocaleDateString(
                              (i18n.resolvedLanguage || i18n.language)?.startsWith('hi') ? 'hi-IN' : 'en-IN',
                            )}
                          </Text>
                        )}
                        {!!paymentId && (
                          <Text style={styles.paymentHistoryId} numberOfLines={1}>
                            {t('subscriptionBilling.paymentId')}: {paymentId}
                          </Text>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {activationModalState !== null && (
        <View style={styles.activationOverlay}>
          <View style={styles.activationModal}>
            <View style={styles.activationBlobTop} />
            <View style={styles.activationBlobBottom} />

            <View style={styles.activationBrandPill}>
              <Zap size={14} color={COLORS.primary} />
              <Text style={styles.activationBrandText}>{t('subscriptionBilling.securePay')}</Text>
            </View>

            <View style={styles.activationVisual}>
              {activationModalState === 'verifying' ? (
                <>
                  <View style={styles.activationOrbit}>
                    <ActivityIndicator size="large" color="#8B5CF6" style={styles.activationSpinner} />
                  </View>
                  <View style={styles.activationCore}>
                    <Zap size={34} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                </>
              ) : (
                <View style={styles.activationSuccessCore}>
                  <Check size={40} color="#FFFFFF" strokeWidth={3} />
                </View>
              )}
            </View>

            <Text style={styles.activationTitle}>
              {activationModalState === 'success'
                ? t('subscriptionBilling.allSet')
                : t('subscriptionBilling.sitBackRelax')}
            </Text>
            <Text style={styles.activationMessage}>
              {activationModalState === 'success'
                ? t('subscriptionBilling.activationSuccessMessage', { planName: activationPlanName })
                : t('subscriptionBilling.activationPendingMessage', { planName: activationPlanName })}
            </Text>

            <View
              style={[
                styles.activationStatusPill,
                activationModalState === 'success' && styles.activationStatusPillSuccess,
              ]}
            >
              {activationModalState === 'success' ? (
                <Check size={16} color="#15803D" strokeWidth={3} />
              ) : (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
              <Text
                style={[
                  styles.activationStatusText,
                  activationModalState === 'success' && styles.activationStatusTextSuccess,
                ]}
              >
                {activationModalState === 'success'
                  ? t('subscriptionBilling.activatedSuccessfully')
                  : t('subscriptionBilling.confirmingStatus')}
              </Text>
            </View>

            {activationModalState === 'verifying' && (
              <Text style={styles.activationHint}>{t('subscriptionBilling.activationHint')}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  paymentFailureOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    paddingHorizontal: 20,
  },
  paymentFailureModal: {
    width: '100%',
    maxWidth: 390,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 24,
    shadowColor: '#7F1D1D',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 20,
  },
  paymentFailureAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 7,
    backgroundColor: '#F97316',
  },
  paymentFailureGlowTop: {
    position: 'absolute',
    top: -75,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFEDD5',
    opacity: 0.8,
  },
  paymentFailureGlowBottom: {
    position: 'absolute',
    bottom: -95,
    left: -90,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#EFF6FF',
    opacity: 0.9,
  },
  paymentFailureCloseButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  paymentFailureIconRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 16,
  },
  paymentFailureIconCore: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 11,
    elevation: 7,
  },
  paymentFailureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  paymentFailureBadgeText: {
    color: '#92400E',
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  paymentFailureTitle: {
    color: COLORS.textPrimary,
    fontSize: 23,
    lineHeight: 29,
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  paymentFailureMessage: {
    maxWidth: 310,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentSupportCard: {
    width: '100%',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 14,
  },
  paymentSupportIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 11,
  },
  paymentSupportDetails: {
    flex: 1,
  },
  paymentSupportLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    marginBottom: 3,
  },
  paymentSupportNumber: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
  },
  paymentSupportCallText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    marginLeft: 8,
  },
  paymentRetryButton: {
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  paymentRetryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Rubik-Bold',
    marginLeft: 9,
  },
  billingCycleSelector: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  billingCycleOption: {
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  billingCycleOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  billingCycleOptionText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
  },
  billingCycleOptionTextActive: {
    color: COLORS.primary,
    fontFamily: 'Rubik-Bold',
  },
  paymentSummaryOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 18,
    paddingVertical: 28,
    zIndex: 950,
    elevation: 28,
  },
  paymentSummaryCard: {
    width: '100%',
    maxWidth: 410,
    maxHeight: '88%',
    minHeight: 430,
    backgroundColor: '#F8FAFC',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 18,
  },
  paymentSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  paymentSummaryHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentSummaryHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginRight: 12,
  },
  paymentSummaryHeaderText: {
    flex: 1,
  },
  paymentSummaryTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
  },
  paymentSummarySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    marginTop: 3,
  },
  paymentSummaryCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  paymentSummaryLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  paymentSummaryLoadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    marginTop: 14,
    textAlign: 'center',
  },
  paymentSummaryErrorText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
  paymentSummaryRetryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 16,
  },
  paymentSummaryRetryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
  },
  paymentSummaryScroll: {
    flex: 1,
  },
  paymentSummaryScrollContent: {
    padding: 18,
    paddingBottom: 26,
  },
  paymentTotalCard: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 22,
  },
  paymentTotalLabel: {
    color: '#DBEAFE',
    fontSize: 12,
    fontFamily: 'Rubik-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  paymentTotalValue: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: 'Rubik-Bold',
    marginTop: 6,
  },
  paymentTotalCaption: {
    color: '#DBEAFE',
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    marginTop: 5,
  },
  paymentHistoryTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
    marginBottom: 12,
  },
  paymentHistoryEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
  },
  paymentHistoryEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    marginTop: 10,
  },
  paymentHistoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentHistoryItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentHistoryAmount: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
  },
  paymentHistoryStatus: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  paymentHistoryStatusText: {
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
  },
  paymentHistoryDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: 'Rubik-Medium',
    marginTop: 9,
  },
  paymentHistoryId: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Rubik-Regular',
    marginTop: 4,
  },
  activationOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 22,
    zIndex: 999,
    elevation: 30,
  },
  activationModal: {
    width: '100%',
    maxWidth: 390,
    minHeight: 430,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 18,
  },
  activationBlobTop: {
    position: 'absolute',
    top: -78,
    right: -72,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DBEAFE',
    opacity: 0.65,
  },
  activationBlobBottom: {
    position: 'absolute',
    bottom: -92,
    left: -82,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#EDE9FE',
    opacity: 0.55,
  },
  activationBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginBottom: 22,
  },
  activationBrandText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 1.1,
  },
  activationVisual: {
    width: 132,
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  activationOrbit: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activationSpinner: {
    transform: [{ scale: 2.7 }],
  },
  activationCore: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
  },
  activationSuccessCore: {
    width: 82,
    height: 82,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
  },
  activationTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  activationMessage: {
    maxWidth: 300,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    marginBottom: 22,
  },
  activationStatusPill: {
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  activationStatusPillSuccess: {
    backgroundColor: '#DCFCE7',
  },
  activationStatusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'Rubik-Bold',
    marginLeft: 8,
  },
  activationStatusTextSuccess: {
    color: '#15803D',
  },
  activationHint: {
    color: COLORS.textPlaceholder,
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
    marginTop: 12,
  },
  activePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  activePlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activePlanHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  activePlanIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePlanTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Rubik-SemiBold',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryButton: {
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    paddingHorizontal: 11,
  },
  summaryButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
  },
  activePlanName: {
    fontSize: 24,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  activePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activePlanDetails: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  statusValue: {
    fontFamily: 'Rubik-Bold',
    textTransform: 'capitalize',
  },
  activePlanBillingCycle: {
    color: COLORS.textPrimary,
    fontFamily: 'Rubik-Bold',
  },
  cancellationScheduledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
  },
  cancellationScheduledText: {
    color: '#B45309',
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    marginLeft: 7,
  },
  cancelSubscriptionButton: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 14,
  },
  cancelSubscriptionButtonText: {
    color: '#DC2626',
    fontSize: 13,
    fontFamily: 'Rubik-Bold',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  currentPlanCard: {
    backgroundColor: '#F8FAFF',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Rubik-Bold',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  planIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planTitleWrapper: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  priceCurrency: {
    fontSize: 16,
    fontFamily: 'Rubik-SemiBold',
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 32,
    fontFamily: 'Rubik-Bold',
    color: COLORS.textPrimary,
    lineHeight: 36,
  },
  priceInterval: {
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: COLORS.textSecondary,
    flex: 1,
  },
  buyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },
  buyButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  scrollSpacer: {
    height: 40,
  },
});

export default SubscriptionDashboardScreen;
