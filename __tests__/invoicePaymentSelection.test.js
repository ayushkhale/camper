import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import PaymentsScreen from '../src/features/payments/screens/PaymentsScreen';

const mockRoute = {
  params: {
    customerId: 42,
    preselectedCustomer: { id: 42, name: 'Invoice Customer' },
    prefillAmount: 322,
  },
};
const mockNavigation = {
  dispatch: jest.fn(),
  setParams: jest.fn(params => Object.assign(mockRoute.params, params)),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
  DrawerActions: { toggleDrawer: jest.fn() },
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));
jest.mock('../src/app/providers/AuthContext', () => ({
  AuthContext: require('react').createContext({ userToken: 'test-token', user: { role: 'vendor' } }),
}));
jest.mock('../src/app/providers/AlertContext', () => ({
  useAlert: () => ({ showAlert: jest.fn() }),
}));
jest.mock('../src/shared/services/api', () => ({
  api: { listCustomers: jest.fn().mockResolvedValue({ success: true, data: [] }) },
}));
jest.mock('../src/shared/components/CurvedHeader', () => () => null);
jest.mock('../src/features/customers/components/AddCustomerModal', () => () => null);

test('selects the invoice customer before the customer list can resolve it', async () => {
  let renderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<PaymentsScreen />);
    await Promise.resolve();
  });

  const visibleTexts = renderer.root.findAllByType(Text).map(node => node.props.children);
  expect(visibleTexts).toContain('Invoice Customer');
  expect(renderer.root.findAllByType(TextInput).some(node => node.props.value === '322')).toBe(true);
  expect(mockNavigation.setParams).toHaveBeenCalledWith({
    preselectedCustomer: undefined,
    customerId: undefined,
    prefillAmount: undefined,
  });

  await ReactTestRenderer.act(async () => renderer.unmount());
});
