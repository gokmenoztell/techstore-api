<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function listForUser(User $user, int $perPage = 15): LengthAwarePaginator
    {
        return Order::query()
            ->with(['items.product'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);
    }

    public function findForUser(User $user, int $orderId): Order
    {
        return Order::query()
            ->with(['items.product'])
            ->where('user_id', $user->id)
            ->findOrFail($orderId);
    }

    public function create(User $user, array $data): Order
    {
        $aggregatedItems = $this->aggregateItems($data['items']);

        return DB::transaction(function () use ($user, $data, $aggregatedItems) {
            $productIds = array_keys($aggregatedItems);

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $totalAmount = '0.00';
            $preparedItems = [];

            foreach ($aggregatedItems as $productId => $quantity) {
                /** @var Product|null $product */
                $product = $products->get($productId);

                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => ["Ürün bulunamadı (ID: {$productId})."],
                    ]);
                }

                if (!$product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ["'{$product->name}' şu anda satışa kapalı."],
                    ]);
                }

                if ($product->stock < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => ["'{$product->name}' için yeterli stok yok (Mevcut: {$product->stock}, İstenen: {$quantity})."],
                    ]);
                }

                $unitPrice = (string) $product->price;
                $lineTotal = bcmul($unitPrice, (string) $quantity, 2);
                $totalAmount = bcadd($totalAmount, $lineTotal, 2);

                $product->decrement('stock', $quantity);

                $preparedItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'line_total' => $lineTotal,
                ];
            }

            $order = Order::create([
                'user_id' => $user->id,
                'status' => Order::STATUS_PENDING,
                'total_amount' => $totalAmount,
                'shipping_address' => $data['shipping_address'] ?? null,
            ]);

            foreach ($preparedItems as $item) {
                $order->items()->create($item);
            }

            return $order->load(['items.product']);
        });
    }

    public function cancel(User $user, int $orderId): Order
    {
        return DB::transaction(function () use ($user, $orderId) {
            /** @var Order $order */
            $order = Order::query()
                ->with(['items'])
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->findOrFail($orderId);

            if ($order->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'order' => ['Bu sipariş zaten iptal edilmiş.'],
                ]);
            }

            if ($order->status !== Order::STATUS_PENDING) {
                throw ValidationException::withMessages([
                    'order' => ['Yalnızca bekleyen (pending) siparişler iptal edilebilir.'],
                ]);
            }

            $productIds = $order->items->pluck('product_id')->unique()->values()->all();

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($order->items as $item) {
                /** @var Product|null $product */
                $product = $products->get($item->product_id);

                if ($product) {
                    $product->increment('stock', $item->quantity);
                }
            }

            $order->update([
                'status' => Order::STATUS_CANCELLED,
            ]);

            return $order->load(['items.product']);
        });
    }

    /**
     * @param  array<int, array{product_id: int|string, quantity: int|string}>  $items
     * @return array<int, int>
     */
    private function aggregateItems(array $items): array
    {
        $totals = [];

        foreach ($items as $item) {
            $productId = (int) $item['product_id'];
            $quantity = (int) $item['quantity'];
            $totals[$productId] = ($totals[$productId] ?? 0) + $quantity;
        }

        return $totals;
    }
}