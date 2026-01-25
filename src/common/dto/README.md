# Common DTOs - Pagination System

**Standardized pagination and search functionality for all endpoints**

---

## Overview

This module provides reusable DTOs for implementing consistent pagination and search across all API endpoints in the application.

## Features

- ✅ **Standardized Pagination**: Consistent page/limit parameters across all endpoints
- ✅ **Built-in Validation**: Automatic validation of pagination parameters
- ✅ **Rich Metadata**: Includes total count, page navigation info
- ✅ **Type-Safe**: Full TypeScript support with generics
- ✅ **Swagger Documentation**: Automatic API documentation generation
- ✅ **Search Support**: Optional search functionality
- ✅ **Extensible**: Easy to extend for custom filters

---

## Available DTOs

### 1. PaginationQueryDto

Base DTO for pagination parameters.

```typescript
class PaginationQueryDto {
  page?: number;    // Default: 1, Min: 1
  limit?: number;   // Default: 10, Min: 1, Max: 100
}
```

**Usage:**
```typescript
import { PaginationQueryDto } from '@common/dto';

@Get()
findAll(@Query() query: PaginationQueryDto) {
  // query.page and query.limit are validated
}
```

**Validation Rules:**
- `page`: Integer, minimum 1, defaults to 1
- `limit`: Integer, minimum 1, maximum 100, defaults to 10

---

### 2. SearchQueryDto

Extends `PaginationQueryDto` with search capability.

```typescript
class SearchQueryDto extends PaginationQueryDto {
  search?: string;
}
```

**Usage:**
```typescript
import { SearchQueryDto } from '@common/dto';

@Get()
findAll(@Query() query: SearchQueryDto) {
  const { page, limit, search } = query;
  // Implement search logic
}
```

**Validation Rules:**
- Inherits all validation from `PaginationQueryDto`
- `search`: Optional string

---

### 3. PaginationMetaDto

Metadata about pagination state.

```typescript
class PaginationMetaDto {
  total: number;           // Total number of items
  page: number;            // Current page number
  limit: number;           // Items per page
  totalPages: number;      // Total number of pages
  hasNextPage: boolean;    // Whether next page exists
  hasPreviousPage: boolean;// Whether previous page exists
}
```

**Constructor:**
```typescript
new PaginationMetaDto(total: number, page: number, limit: number)
```

**Auto-calculated fields:**
- `totalPages`: Calculated as `Math.ceil(total / limit)`
- `hasNextPage`: True if `page < totalPages`
- `hasPreviousPage`: True if `page > 1`

---

### 4. PaginatedResponseDto<T>

Generic response wrapper for paginated data.

```typescript
class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMetaDto;
}
```

**Constructor:**
```typescript
new PaginatedResponseDto<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
)
```

**Usage:**
```typescript
import { PaginatedResponseDto } from '@common/dto';

async findAll(query: SearchQueryDto): Promise<PaginatedResponseDto<User>> {
  const { page, limit } = query;
  const [data, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return new PaginatedResponseDto(data, total, page, limit);
}
```

---

## Implementation Guide

### Step 1: Service Layer

```typescript
import { PaginatedResponseDto, SearchQueryDto } from '@common/dto';

@Injectable()
export class MyService {
  async findAllPaginated(
    query: SearchQueryDto
  ): Promise<PaginatedResponseDto<MyEntity>> {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {
      // Your base conditions
    };

    if (search) {
      whereConditions.name = ILike(`%${search}%`);
    }

    const [data, total] = await this.repository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }
}
```

### Step 2: Controller Layer

```typescript
import { PaginatedResponseDto, SearchQueryDto } from '@common/dto';

@Controller('my-resource')
export class MyController {
  @Get()
  @ApiOperation({ summary: 'Get paginated items' })
  @ApiOkResponse({ type: PaginatedResponseDto })
  async findAll(
    @Query() query: SearchQueryDto
  ): Promise<PaginatedResponseDto<MyDto>> {
    return this.service.findAllPaginated(query);
  }
}
```

---

## Examples

### Example 1: Basic Pagination

**Request:**
```http
GET /api/v1/users?page=2&limit=20
```

**Response:**
```json
{
  "data": [
    { "id": 21, "email": "user21@example.com" },
    { "id": 22, "email": "user22@example.com" },
    ...
  ],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

### Example 2: Pagination with Search

**Request:**
```http
GET /api/v1/users?page=1&limit=10&search=john
```

**Response:**
```json
{
  "data": [
    { "id": 5, "email": "john.doe@example.com" },
    { "id": 42, "email": "johnny@example.com" }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Example 3: Custom Query DTO

Create custom DTO for specific filters:

```typescript
import { SearchQueryDto } from '@common/dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export class GetUsersQueryDto extends SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter by role ID',
  })
  @IsOptional()
  @Type(() => Number)
  roleId?: number;
}
```

**Usage:**
```http
GET /api/v1/users?page=1&limit=20&search=john&status=ACTIVE&roleId=5
```

---

## Best Practices

### 1. Always Use Standard DTOs
```typescript
// ✅ Good - Uses standard DTO
@Get()
findAll(@Query() query: SearchQueryDto) {
  return this.service.findAllPaginated(query);
}

// ❌ Bad - Custom parameters
@Get()
findAll(
  @Query('page') page: number,
  @Query('limit') limit: number
) {
  // No validation, inconsistent
}
```

### 2. Extend for Custom Filters
```typescript
// ✅ Good - Extends base DTO
export class GetResourcesQueryDto extends SearchQueryDto {
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;
}

// ❌ Bad - Duplicates pagination logic
export class GetResourcesQueryDto {
  @IsOptional()
  page?: number;
  @IsOptional()
  limit?: number;
  // ...
}
```

### 3. Use Generic Response Type
```typescript
// ✅ Good - Generic type
async findAll(query: SearchQueryDto): Promise<PaginatedResponseDto<User>> {
  return new PaginatedResponseDto(data, total, page, limit);
}

// ❌ Bad - Custom response structure
async findAll(query: SearchQueryDto) {
  return {
    items: data,
    pagination: { /* ... */ }
  };
}
```

### 4. Calculate Skip Correctly
```typescript
// ✅ Good
const skip = (page - 1) * limit;

// ❌ Bad
const skip = page * limit; // Off by one page
```

### 5. Always Return Consistent Structure
```typescript
// ✅ Good - Uses constructor
return new PaginatedResponseDto(data, total, page, limit);

// ❌ Bad - Manual object creation
return {
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPreviousPage: page > 1,
  }
};
```

---

## Common Patterns

### Pattern 1: Multi-Tenant Pagination

```typescript
async findAllPaginated(query: SearchQueryDto) {
  const teamId = this.cls.get('tenantId');
  const { page = 1, limit = 10, search } = query;
  
  const whereConditions = {
    team: { id: teamId },
    ...(search && { name: ILike(`%${search}%`) })
  };

  const [data, total] = await this.repository.findAndCount({
    where: whereConditions,
    skip: (page - 1) * limit,
    take: limit,
  });

  return new PaginatedResponseDto(data, total, page, limit);
}
```

### Pattern 2: With Relations

```typescript
async findAllPaginated(query: SearchQueryDto) {
  const { page = 1, limit = 10 } = query;
  
  const [data, total] = await this.repository.findAndCount({
    relations: ['parent', 'children'],
    skip: (page - 1) * limit,
    take: limit,
  });

  return new PaginatedResponseDto(data, total, page, limit);
}
```

### Pattern 3: With Sorting

```typescript
async findAllPaginated(
  query: SearchQueryDto & { sortBy?: string; sortOrder?: 'ASC' | 'DESC' }
) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
  
  const [data, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { [sortBy]: sortOrder },
  });

  return new PaginatedResponseDto(data, total, page, limit);
}
```

---

## Migration Guide

### From Old Pagination to New System

**Before:**
```typescript
// Old custom pagination
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
) {
  const data = await this.service.findAll(page, limit);
  return {
    items: data,
    total: data.length
  };
}
```

**After:**
```typescript
// New standardized pagination
import { PaginatedResponseDto, PaginationQueryDto } from '@common/dto';

@Get()
async findAll(
  @Query() query: PaginationQueryDto
): Promise<PaginatedResponseDto<MyDto>> {
  return this.service.findAllPaginated(query);
}
```

---

## Testing

### Unit Test Example

```typescript
describe('MyService', () => {
  it('should return paginated results', async () => {
    const query = { page: 1, limit: 10 };
    const mockData = [/* ... */];
    const mockTotal = 25;

    jest.spyOn(repository, 'findAndCount')
      .mockResolvedValue([mockData, mockTotal]);

    const result = await service.findAllPaginated(query);

    expect(result.data).toEqual(mockData);
    expect(result.meta.total).toBe(25);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.totalPages).toBe(3);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(false);
  });
});
```

### E2E Test Example

```typescript
describe('GET /resources', () => {
  it('should return paginated resources', () => {
    return request(app.getHttpServer())
      .get('/resources?page=1&limit=10')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(res.body.meta).toHaveProperty('total');
        expect(res.body.meta).toHaveProperty('page', 1);
        expect(res.body.meta).toHaveProperty('limit', 10);
      });
  });
});
```

---

## Performance Tips

1. **Use Indexes**: Ensure database columns used in WHERE clauses are indexed
2. **Limit Max Page Size**: Maximum limit is capped at 100 to prevent large queries
3. **Use Skip/Take**: More efficient than OFFSET/LIMIT in TypeORM
4. **Avoid COUNT(*) on Large Tables**: Consider caching total counts
5. **Use Select Specific Fields**: Don't load all columns if not needed

---

## Troubleshooting

### Issue: Pagination not working
**Solution:** Ensure you're using `findAndCount()` not `find()`

### Issue: Incorrect total count
**Solution:** Make sure WHERE conditions are the same for data and count queries

### Issue: Validation errors
**Solution:** Ensure query parameters are transformed with `@Type(() => Number)`

### Issue: Missing metadata
**Solution:** Use `PaginatedResponseDto` constructor, not manual object creation

---

## Related Files

- `/src/common/dto/pagination-query.dto.ts` - Base pagination DTO
- `/src/common/dto/search-query.dto.ts` - Search + pagination DTO
- `/src/common/dto/pagination-meta.dto.ts` - Metadata DTO
- `/src/common/dto/paginated-response.dto.ts` - Response wrapper

---

## Version History

- **v1.0.0** (2024) - Initial pagination system
  - PaginationQueryDto
  - SearchQueryDto
  - PaginationMetaDto
  - PaginatedResponseDto

---

**Maintained by:** YouthTechSync Team  
**Status:** ✅ Production Ready