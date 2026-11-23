const BASE_URL = '/api/account-types';

/**
 * Fetch active account types for Signup Page
 */
export async function fetchPublicAccountTypes() {
  try {
    const res = await fetch(`${BASE_URL}`);
    if (!res.ok) throw new Error('Failed to fetch public account types');
    const data = await res.json();
    return data.accountTypes || [];
  } catch (err) {
    console.warn('fetchPublicAccountTypes fallback note:', err.message);
    return [];
  }
}

/**
 * Fetch all account types for Admin Panel
 */
export async function fetchAllAccountTypesAdmin() {
  try {
    const res = await fetch(`${BASE_URL}/all`);
    if (!res.ok) throw new Error('Failed to fetch all account types');
    const data = await res.json();
    return data.accountTypes || [];
  } catch (err) {
    console.error('fetchAllAccountTypesAdmin error:', err);
    return [];
  }
}

/**
 * Admin: Create a new account type
 */
export async function createAccountTypeAdmin(payload) {
  try {
    const res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('createAccountTypeAdmin error:', err);
    return { success: false, message: 'Network error creating account type.' };
  }
}

/**
 * Admin: Update an existing account type
 */
export async function updateAccountTypeAdmin(id, payload) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('updateAccountTypeAdmin error:', err);
    return { success: false, message: 'Network error updating account type.' };
  }
}

/**
 * Admin: Delete an account type
 */
export async function deleteAccountTypeAdmin(id) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (err) {
    console.error('deleteAccountTypeAdmin error:', err);
    return { success: false, message: 'Network error deleting account type.' };
  }
}
