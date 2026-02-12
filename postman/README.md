# Migti CRM Backend - Postman Collection

## Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** (top left)
3. Drag and drop or select:
   - `Migti_CRM_Backend.postman_collection.json`
   - `Migti_CRM_Backend.postman_environment.json`
4. Click **Import**

### 2. Select Environment

1. In the top-right dropdown, select **Migti CRM - Local**
2. Ensure `server_url` is `http://localhost:4545` (or your server URL)

### 3. Login and Run

1. Run **Auth → Login (Admin)** with valid credentials
2. On success, `auth_token` is auto-saved
3. All subsequent requests use `Authorization: Bearer {{auth_token}}` automatically

---

## Collection Structure

| Folder | Description |
|--------|-------------|
| **Auth** | Admin, SuperAdmin, Employee login (auto-saves token) |
| **Products** | Create, List, Get, Update, Delete, Upload Images (S3 + Local) |
| **Images** | Upload to S3, Delete image |
| **Categories** | CRUD |
| **Brands** | CRUD |
| **Companies** | CRUD |
| **Company Branches** | CRUD |
| **Suppliers** | CRUD + Search |
| **Employees** | CRUD + Login |
| **Raw Queries** | CRUD |
| **Rate Cards** | CRUD + Supplier add/update/delete |
| **Admin** | CRUD + Update Access |
| **Roles** | CRUD |
| **Health** | Health check, API test |

---

## Token Auto-Save

Login requests use the **Tests** tab to save the token:

```javascript
if (responseJson.success && responseJson.data.accessToken) {
  pm.environment.set('auth_token', responseJson.data.accessToken);
}
```

---

## Product + Images Flow

1. Create Category → Create Brand (to get IDs)
2. Create Product (use category_id, brand_id)
3. **Upload Product Images (S3)** – select files, `productId` from collection var
4. Get Product by ID – images returned with product
5. **Delete Image** – use image_id from upload response

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `server_url` | Base server URL (e.g. http://localhost:4545) |
| `base_url` | API base (server_url + /api) |
| `auth_token` | JWT (auto-set on login) |
| `product_id` | Auto-set on product create |
| `category_id` | Auto-set on category create |
| `brand_id` | Auto-set on brand create |
| `company_id` | Auto-set on company create |
| `company_branch_id` | Auto-set on branch create |
| `employee_id` | Auto-set on employee create |
| `supplier_id` | Auto-set on supplier create |
| `image_id` | Auto-set on image upload |

---

## Notes

- **Auth**: APIs are currently unauthenticated; token is prepared for when auth middleware is enabled
- **S3 Upload**: Requires AWS env vars and productId for product images
- **Dependencies**: Create Category and Brand before Product; Create Company and Branch before Employee
