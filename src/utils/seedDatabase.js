import { api } from '../services/api';

export const seedDatabase = async (userToken) => {
  try {
    console.log('Starting DB Seed...');

    // 1. Create 10 Products
    const createdProducts = [];
    for (let i = 1; i <= 10; i++) {
      const formData = new FormData();
      formData.append('name', `Seed Product ${i}`);
      formData.append('price', (20 + i).toString());
      formData.append('unit', 'can');
      formData.append('isReturnableContainer', 'true');
      formData.append('depositAmount', '150');
      
      const res = await api.createProduct(userToken, formData);
      if (res.success) {
        createdProducts.push(res.data);
      }
    }
    console.log(`Created ${createdProducts.length} products.`);

    // 2. Create 10 Customers and Subscriptions
    let createdCustomers = 0;
    let createdSubscriptions = 0;
    
    // Get today's date in YYYY-MM-DD
    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 1; i <= 10; i++) {
      // Phone number: +91 9999990001 etc
      const phone = `+919999990${String(i).padStart(3, '0')}`;
      
      const customerRes = await api.createCustomer(userToken, {
        name: `Seed Customer ${i}`,
        phone: phone,
        address: `Seed Address Line ${i}, City`
      });

      if (customerRes.success) {
        createdCustomers++;
        const customerId = customerRes.data.id;
        
        // Link to a product
        const productId = createdProducts[(i - 1) % createdProducts.length].id;

        const subRes = await api.createSubscription(userToken, {
          customerId,
          productId,
          baseQuantity: 1 + (i % 3), // 1, 2, or 3
          recurrencePattern: 'daily',
          startDate: startDate
        });

        if (subRes.success) {
          createdSubscriptions++;
        }
      }
    }

    console.log(`Created ${createdCustomers} customers and ${createdSubscriptions} subscriptions.`);
    return {
      success: true,
      message: `Seeded ${createdProducts.length} products, ${createdCustomers} customers, ${createdSubscriptions} subscriptions.`
    };
  } catch (err) {
    console.error('Seed Database Error:', err);
    return {
      success: false,
      message: err.message || 'Seed failed'
    };
  }
};
