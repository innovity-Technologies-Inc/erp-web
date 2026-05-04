# API Conventions — Laravel ↔ React Contract

Exact JSON contract between Laravel backend and React frontend.
Both sides must follow this. When converting Blade controllers, ensure they match.

---

## 1. Standard Response Envelope

Every Laravel API response must use this shape:

```json
// Success — single item
{ "success": true, "message": "Product created successfully", "data": { "id": 1, "name": "Widget" } }

// Success — paginated list
{
  "success": true,
  "message": "OK",
  "data": [ {...}, {...} ],
  "meta": { "current_page": 1, "last_page": 5, "per_page": 25, "total": 120 },
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." }
}

// Validation error (422)
{ "success": false, "message": "The given data was invalid.", "errors": { "name": ["The name field is required."] } }

// Auth error (401)
{ "success": false, "message": "Unauthenticated." }

// Permission error (403)
{ "success": false, "message": "This action is unauthorized." }

// Server error (500)
{ "success": false, "message": "Server error. Please try again." }
```

---

## 2. Laravel Controller Helpers

Add to `app/Http/Controllers/Controller.php`:

```php
protected function success($data, string $message = 'OK', int $code = 200): JsonResponse
{
    return response()->json(['success' => true, 'message' => $message, 'data' => $data], $code);
}

protected function paginated($resource): JsonResponse
{
    return response()->json([
        'success' => true, 'message' => 'OK',
        'data'    => $resource->collection,
        'meta'    => [
            'current_page' => $resource->currentPage(),
            'last_page'    => $resource->lastPage(),
            'per_page'     => $resource->perPage(),
            'total'        => $resource->total(),
        ],
        'links'   => [
            'first' => $resource->url(1),
            'last'  => $resource->url($resource->lastPage()),
            'prev'  => $resource->previousPageUrl(),
            'next'  => $resource->nextPageUrl(),
        ],
    ]);
}

protected function error(string $message, int $code = 422): JsonResponse
{
    return response()->json(['success' => false, 'message' => $message], $code);
}
```

---

## 3. Auth Endpoints (JWT)

```
POST   /api/auth/login     → { email, password } → { token, user, permissions[] }
POST   /api/auth/logout    → invalidates token
POST   /api/auth/refresh   → { token } → { token } (if using refresh tokens)
GET    /api/auth/me        → returns current user + permissions
```

Login response `data` shape:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "name": "Admin User", "email": "admin@erp.com", "role": "admin" },
  "permissions": ["inventory.read", "inventory.write", "hrm.read", "accounts.read"]
}
```

---

## 4. Standard Resource Endpoints

Use `Route::apiResource()` in Laravel:

```
GET    /api/products           → paginated list (filtered, sorted)
POST   /api/products           → create
GET    /api/products/{id}      → single item
PUT    /api/products/{id}      → full update
PATCH  /api/products/{id}      → partial update
DELETE /api/products/{id}      → delete

Same pattern for: /api/employees, /api/accounts, /api/invoices, /api/vendors
```

---

## 5. Filtering, Sorting, Pagination (Query Params)

React sends as query params. Laravel reads via `$request->query()`:

```
GET /api/products?page=2&per_page=25&search=widget&category_id=3&sort=name&dir=asc
```

Laravel controller pattern:
```php
public function index(Request $request)
{
    $products = Product::query()
        ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
        ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
        ->orderBy($request->sort ?? 'created_at', $request->dir ?? 'desc')
        ->paginate($request->per_page ?? 25);

    return $this->paginated(ProductResource::collection($products));
}
```

---

## 6. File Upload

```typescript
// React — multipart/form-data
const uploadFile = (file: File, productId: number) => {
  const form = new FormData()
  form.append('file', file)
  form.append('_method', 'PUT')   // Laravel method spoofing for PUT via POST
  return apiClient.post(`/products/${productId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

```php
// Laravel
public function uploadImage(Request $request, Product $product)
{
    $request->validate(['file' => 'required|image|max:2048']);
    $path = $request->file('file')->store('products', 'public');
    $product->update(['image_path' => $path]);
    return $this->success(['image_url' => Storage::url($path)]);
}
```

---

## 7. Eager-Loaded Relations — TypeScript Types

Laravel returns nested objects. Always type relations as optional:

```typescript
// src/modules/inventory/api/types.ts
export interface Product {
  id:          number
  name:        string
  sku:         string
  unit_price:  number
  stock_qty:   number
  created_at:  string  // ISO string from Laravel
  updated_at:  string
  // Eager-loaded relations — optional because not always included
  category?:   ProductCategory
  vendor?:     Vendor
}

export interface ProductCategory { id: number; name: string; slug: string }

export interface ProductFilters {
  page?:        number
  per_page?:    number
  search?:      string
  category_id?: number
  sort?:        string
  dir?:         'asc' | 'desc'
}

export interface CreateProductDto {
  name:        string
  sku:         string
  category_id: number
  unit_price:  number
  stock_qty:   number
  unit:        'pcs' | 'kg' | 'litre' | 'box'
  description?: string
}
```

In React, always guard relation access:
```tsx
<span>{product.category?.name ?? '—'}</span>
```

---

## 8. Permission Names Convention

Use `{module}.{action}` format. Must match Laravel Gate/Spatie permission names exactly:

```
inventory.read      inventory.write     inventory.delete
accounts.read       accounts.write      accounts.delete
hrm.read            hrm.write           hrm.delete
hrm.payroll         hrm.payroll.approve
reports.view        reports.export
settings.read       settings.write
```

---

## 9. CORS Configuration (Laravel)

```php
// config/cors.php
'paths'           => ['api/*'],
'allowed_origins' => ['http://localhost:5173', 'https://yourdomain.com'],
'allowed_methods' => ['*'],
'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
'exposed_headers' => [],
'max_age'         => 0,
'supports_credentials' => false,  // false for JWT (no cookies needed)
```

---

## 10. JWT Laravel Setup (tymon/jwt-auth)

```php
// routes/api.php
Route::prefix('auth')->group(function () {
    Route::post('login',   [AuthController::class, 'login']);
    Route::post('logout',  [AuthController::class, 'logout'])->middleware('auth:api');
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
    Route::get('me',       [AuthController::class, 'me'])->middleware('auth:api');
});

Route::middleware('auth:api')->group(function () {
    Route::apiResource('products',  ProductController::class);
    Route::apiResource('employees', EmployeeController::class);
    // ... other resources
});
```

```php
// app/Http/Controllers/AuthController.php
public function login(Request $request)
{
    $credentials = $request->validate([
        'email'    => 'required|email',
        'password' => 'required',
    ]);

    if (!$token = auth('api')->attempt($credentials)) {
        return $this->error('Invalid credentials', 401);
    }

    return $this->success([
        'token'       => $token,
        'user'        => auth('api')->user(),
        'permissions' => auth('api')->user()->getAllPermissions()->pluck('name'),
    ]);
}

public function refresh()
{
    return $this->success(['token' => auth('api')->refresh()]);
}
```