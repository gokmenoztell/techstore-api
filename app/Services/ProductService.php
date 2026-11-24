<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ProductService
{
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Product::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? (bool) $filters['is_active']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function find(int $id): Product
    {
        return Product::findOrFail($id);
    }

    public function create(array $data): Product
    {
        $data['slug'] = $this->generateUniqueSlug($data['slug'] ?? $data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        if (array_key_exists('slug', $data) && filled($data['slug'])) {
            $data['slug'] = $this->generateUniqueSlug($data['slug'], $product->id);
        } elseif (array_key_exists('name', $data) && blank($product->slug)) {
            $data['slug'] = $this->generateUniqueSlug($data['name'], $product->id);
        }

        $product->update($data);

        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    private function generateUniqueSlug(string $source, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($source);
        $baseSlug = $baseSlug !== '' ? $baseSlug : 'product';

        $slug = $baseSlug;
        $counter = 2;

        while (
            Product::query()
                ->where('slug', $slug)
                ->when($ignoreId !== null, fn($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}