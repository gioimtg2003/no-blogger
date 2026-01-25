# Resource Management API

Comprehensive CRUD API for managing resources in the YouthTechSync backend application.

## Table of Contents

- [Overview](#overview)
- [Entity Structure](#entity-structure)
- [Business Logic](#business-logic)
- [API Endpoints](#api-endpoints)
- [DTOs](#dtos)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Examples](#examples)

## Overview

The Resource module provides a complete CRUD (Create, Read, Update, Delete) interface for managing content resources. Resources can be hierarchical (parent-child relationships) and are scoped to teams with multi-tenancy support.

### Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Pagination and filtering
- ✅ Search functionality
- ✅ Hierarchical structure (parent-child relationships)
- ✅ Soft delete with restore capability
- ✅ Multi-tenancy support (team-scoped)
- ✅ Plan-based resource limits
- ✅ Circular reference prevention
- ✅ Resource statistics
- ✅ Slug-based lookup
- ✅ Permission-based access control

## Entity Structure

### Resource Entity

```typescript
{
  id: number;                    // Primary key
  name: string;                  // Resource name (4-100 characters)
  description?: string;          // Optional description
  slug: string;                  // Unique URL-friendly identifier
  type: ResourceType;            // BLOG, PAGE, PODCAST, VIDEO, etc.
  metadata?: {                   // Optional UI customization
    color?: string;              // Hex color code
    icon?: string;               // Icon identifier
    bannerUrl?: string;          // Banner image URL
  };
  isActive: boolean;             // Active status (default: true)
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
  
  // Relations
  team: Team;                    // Associated team
  parent?: Resource;             // Parent resource (for hierarchy)
  children?: Resource[];         // Child resources
  contents?: Content[];          // Associated content items
}
```

### Resource Types

```typescript
enum ResourceType {
  BLOG = 1,
  EVENT = 2,
  DOCUMENT = 3,
  MEDIA = 4,
  LANDING_PAGE = 5,
}
```

## Business Logic

### 1. **Creation Rules**

- ✅ Slug must be unique within the team
- ✅ Plan-based resource limits are enforced
- ✅ Parent resource must exist (if specified)
- ✅ Team context is required (via CLS)
- ✅ User authentication required

### 2. **Update Rules**

- ✅ Slug uniqueness validation (if changed)
- ✅ Cannot set resource as its own parent
- ✅ Circular reference prevention (parent cannot be a descendant)
- ✅ Parent validation (must exist in same team)

### 3. **Deletion Rules**

**Soft Delete:**
- Sets `isActive` to `false`
- Cannot delete if resource has children
- Can be restored later

**Hard Delete:**
- Permanent deletion from database
- Cannot delete if resource has children
- Cannot delete if resource has associated content
- Cannot be undone

### 4. **Multi-Tenancy**

All operations are scoped to the team context from CLS (Context Local Storage):
- Automatic team filtering on all queries
- Team ID validated on create/update operations
- Cross-team access prevented

### 5. **Plan Limits**

```typescript
PLAN_RESOURCE = {
  [UserPlan.FREE]: 6,
  [UserPlan.PREMIUM]: 12,
  [UserPlan.UNLIMITED]: 999,
}
```

## API Endpoints

### Base URL
```
/api/v1/resource
```

### Authentication
All endpoints require:
- `UserAuthGuard`: User must be authenticated
- `PermissionGuard`: User must have appropriate permissions
- `HeaderTeamAlias`: Team context via header

---

### 1. Get All Resources (Paginated)

**GET** `/resources`

Retrieve a paginated list of resources with optional filtering.

**Query Parameters:**

| Parameter | Type    | Required | Default | Description                      |
|-----------|---------|----------|---------|----------------------------------|
| page      | number  | No       | 1       | Page number (min: 1)             |
| limit     | number  | No       | 10      | Items per page (min: 1, max: 100)|
| search    | string  | No       | -       | Search in name/description       |
| type      | enum    | No       | -       | Filter by ResourceType           |
| isActive  | boolean | No       | -       | Filter by active status          |
| parentId  | number  | No       | -       | Filter by parent resource ID     |

**Response:**
```typescript
{
  data: ResourceResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Permissions Required:** `read:resource`

---

### 2. Get Resource by ID

**GET** `/resources/:id`

Retrieve a single resource by its ID.

**URL Parameters:**
- `id` (number): Resource ID

**Response:** `ResourceResponseDto`

**Permissions Required:** `read:resource`

---

### 3. Get Resource by Slug

**GET** `/resources/slug/:slug`

Retrieve a single resource by its slug.

**URL Parameters:**
- `slug` (string): Resource slug

**Response:** `ResourceResponseDto`

**Permissions Required:** `read:resource`

---

### 4. Get Resource Statistics

**GET** `/resources/statistics`

Retrieve statistics about resources in the team.

**Response:**
```typescript
{
  total: number;
  active: number;
  inactive: number;
  byType: {
    [ResourceType]: number;
  };
}
```

**Permissions Required:** `read:resource`

---

### 5. Create Resource

**POST** `/resources`

Create a new resource.

**Request Body:** `CreateResourceDto`

```typescript
{
  name: string;              // Required, 4-100 chars
  description?: string;      // Optional, 4-100 chars
  slug?: string;             // Optional, 4-100 chars, URL-friendly
  type?: ResourceType;       // Optional, default: BLOG
  parentId?: number;         // Optional, parent resource ID
  metadata?: {               // Optional
    color?: string;          // Hex color code
    icon?: string;           // Icon identifier
    bannerUrl?: string;      // Valid URL
  };
}
```

**Response:** `boolean` (true on success)

**Permissions Required:** `create:resource`

**Errors:**
- `409 CONFLICT`: Slug already exists
- `409 CONFLICT`: Resource limit reached
- `400 BAD_REQUEST`: Parent not found

---

### 6. Update Resource (Full)

**PUT** `/resources/:id`

Fully update a resource.

**URL Parameters:**
- `id` (number): Resource ID

**Request Body:** `UpdateResourceDto` (all fields optional)

**Response:** `ResourceResponseDto`

**Permissions Required:** `update:resource`

**Errors:**
- `404 NOT_FOUND`: Resource not found
- `409 CONFLICT`: Slug already exists
- `400 BAD_REQUEST`: Invalid parent or circular reference

---

### 7. Update Resource (Partial)

**PATCH** `/resources/:id`

Partially update a resource.

**URL Parameters:**
- `id` (number): Resource ID

**Request Body:** `UpdateResourceDto` (partial fields)

**Response:** `ResourceResponseDto`

**Permissions Required:** `update:resource`

---

### 8. Toggle Active Status

**PATCH** `/resources/:id/toggle-active`

Toggle the active status of a resource.

**URL Parameters:**
- `id` (number): Resource ID

**Response:** `ResourceResponseDto`

**Permissions Required:** `update:resource`

---

### 9. Restore Resource

**PATCH** `/resources/:id/restore`

Restore a soft-deleted resource.

**URL Parameters:**
- `id` (number): Resource ID

**Response:** `ResourceResponseDto`

**Permissions Required:** `update:resource`

**Errors:**
- `404 NOT_FOUND`: Inactive resource not found

---

### 10. Soft Delete Resource

**DELETE** `/resources/:id/soft`

Soft delete a resource (sets isActive to false).

**URL Parameters:**
- `id` (number): Resource ID

**Response:** `boolean` (true on success)

**Permissions Required:** `delete:resource`

**Errors:**
- `404 NOT_FOUND`: Resource not found
- `400 BAD_REQUEST`: Resource has children

---

### 11. Delete Resource (Permanent)

**DELETE** `/resources/:id`

Permanently delete a resource from the database.

**URL Parameters:**
- `id` (number): Resource ID

**Response:** `boolean` (true on success)

**Permissions Required:** `delete:resource`

**Errors:**
- `404 NOT_FOUND`: Resource not found
- `400 BAD_REQUEST`: Resource has children
- `400 BAD_REQUEST`: Resource has associated content

---

## DTOs

### CreateResourceDto

```typescript
class CreateResourceDto {
  name: string;              // Required, 4-100 chars
  description?: string;      // Optional, 4-100 chars
  slug?: string;             // Optional, valid slug format
  type?: ResourceType;       // Optional, default: BLOG
  parentId?: number;         // Optional
  metadata?: {
    color?: string;          // Valid hex color
    icon?: string;
    bannerUrl?: string;      // Valid URL
  };
}
```

### UpdateResourceDto

```typescript
class UpdateResourceDto extends PartialType(CreateResourceDto) {
  // All fields from CreateResourceDto are optional
}
```

### GetResourcesQueryDto

```typescript
class GetResourcesQueryDto {
  page?: number;             // Default: 1, min: 1
  limit?: number;            // Default: 10, min: 1, max: 100
  search?: string;
  type?: ResourceType;
  isActive?: boolean;
  parentId?: number;
}
```

### ResourceResponseDto

```typescript
class ResourceResponseDto {
  id: number;
  name: string;
  description?: string;
  slug: string;
  type: ResourceType;
  metadata?: ResourceMetaDataResponseDto;
  isActive: boolean;
  parentId?: number;
  parent?: ResourceResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

### Error Codes

```typescript
enum ResourceError {
  RESOURCE_NOT_FOUND = 400,           // Resource doesn't exist
  SLUG_ALREADY_EXISTS = 401,          // Slug is not unique
  PARENT_NOT_FOUND = 402,             // Parent resource not found
  RESOURCE_LIMIT_REACHED = 403,       // Plan limit exceeded
  RESOURCE_CANNOT_UPDATE = 404,       // Invalid update (circular ref, etc.)
  RESOURCE_CANNOT_DELETE = 405,       // Cannot delete resource
  RESOURCE_HAS_CHILDREN = 406,        // Has child resources
  RESOURCE_IN_USE = 407,              // Has associated content
}
```

### HTTP Status Codes

- `200 OK`: Successful GET, PUT, PATCH, DELETE
- `201 CREATED`: Successful POST
- `400 BAD_REQUEST`: Validation error, business rule violation
- `404 NOT_FOUND`: Resource not found
- `409 CONFLICT`: Duplicate slug, limit reached

## Testing

### Unit Tests

Run unit tests for the service:

```bash
npm test -- resource.service.spec.ts
```

**Coverage includes:**
- ✅ All CRUD operations
- ✅ Pagination and filtering
- ✅ Validation rules
- ✅ Error scenarios
- ✅ Business logic (circular references, limits, etc.)

### E2E Tests

Run E2E tests for the controller:

```bash
npm test -- resource.controller.spec.ts
```

**Coverage includes:**
- ✅ All API endpoints
- ✅ Request validation
- ✅ Response format
- ✅ Error handling

## Examples

### Example 1: Create a Blog Resource

```bash
POST /api/v1/resource
Headers:
  Authorization: Bearer <token>
  x-team-alias: my-team

Body:
{
  "name": "Tech Blog",
  "description": "A blog about technology trends",
  "slug": "tech-blog",
  "type": 1,
  "metadata": {
    "color": "#3B82F6",
    "icon": "ri-article-line",
    "bannerUrl": "https://example.com/banner.jpg"
  }
}

Response:
{
  "success": true
}
```

### Example 2: Get Paginated Resources with Filters

```bash
GET /api/v1/resource?page=1&limit=20&type=1&isActive=true&search=tech
Headers:
  Authorization: Bearer <token>
  x-team-alias: my-team

Response:
{
  "data": [
    {
      "id": 1,
      "name": "Tech Blog",
      "slug": "tech-blog",
      "type": 1,
      "isActive": true,
      ...
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Example 3: Create Child Resource

```bash
POST /api/v1/resource
Body:
{
  "name": "JavaScript Articles",
  "slug": "javascript-articles",
  "parentId": 1,
  "type": 1
}
```

### Example 4: Update Resource

```bash
PATCH /api/v1/resource/1
Body:
{
  "name": "Updated Tech Blog",
  "metadata": {
    "color": "#10B981"
  }
}
```

### Example 5: Soft Delete and Restore

```bash
# Soft delete
DELETE /api/v1/resource/1/soft
Response: true

# Restore
PATCH /api/v1/resource/1/restore
Response: { id: 1, name: "Tech Blog", isActive: true, ... }
```

### Example 6: Get Statistics

```bash
GET /api/v1/resource/statistics
Response:
{
  "total": 25,
  "active": 22,
  "inactive": 3,
  "byType": {
    "1": 15,
    "5": 8,
    "4": 2
  }
}
```

## Best Practices

1. **Always use slugs for public URLs** - They're SEO-friendly and human-readable
2. **Soft delete before hard delete** - Provides data recovery option
3. **Check for children before deletion** - Prevents orphaned resources
4. **Use pagination** - Don't fetch all resources at once
5. **Filter by team context** - Always respect multi-tenancy
6. **Validate circular references** - When updating parent relationships
7. **Monitor plan limits** - Track resource usage per team

## Architecture

### Service Layer (`resource.service.ts`)

- Business logic implementation
- Database operations via TypeORM Repository
- Team context management via ClsService
- Validation and error handling

### Controller Layer (`resource.controller.ts`)

- HTTP endpoint definitions
- Request/response handling
- Permission guards
- Swagger documentation

### Data Layer

- TypeORM entities
- Database migrations
- Relationship management

## Dependencies

- `@nestjs/typeorm`: Database ORM
- `nestjs-cls`: Context Local Storage for multi-tenancy
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation
- `@casl/ability`: Permission management

## Future Enhancements

- [ ] Bulk operations (create/update/delete multiple)
- [ ] Resource versioning
- [ ] Audit log integration
- [ ] Resource templates
- [ ] Import/Export functionality
- [ ] Advanced search with full-text search
- [ ] Resource tags/categories
- [ ] Resource analytics

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Maintainer:** Nguyen Cong Gioi