<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
        if (
            Schema::hasTable('order_items')
            && Schema::hasColumn('order_items', 'product_id')
            && OrderItem::query()->where('product_id', $product->id)->exists()
        ) {
            throw ValidationException::withMessages([
                'product' => ['Bu ürüne ait sipariş kayıtları bulunduğu için silinemez. Ürünü satışa kapatabilir veya stoğunu 0 yapabilirsiniz.'],
            ]);
        }

        try {
            $product->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'product' => ['Bu ürün ilişkili kayıtlar nedeniyle silinemedi. Ürünü satışa kapatabilir veya stoğunu 0 yapabilirsiniz.'],
            ]);
        }
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