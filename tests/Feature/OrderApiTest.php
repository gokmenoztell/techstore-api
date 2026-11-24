<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    private function createProduct(array $overrides = []): Product
    {
        return Product::create(array_merge([
            'name' => 'Mechanical Keyboard',
            'slug' => 'mechanical-keyboard-' . uniqid(),
            'description' => 'Test product',
            'price' => '2499.00',
            'stock' => 10,
            'is_active' => true,
        ], $overrides));
    }

    public function test_authenticated_user_can_create_order_and_stock_is_decremented(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['price' => '2499.00', 'stock' => 10]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/orders', [
            'shipping_address' => 'Esenler, Istanbul',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', Order::STATUS_PENDING)
            ->assertJsonPath('data.total_amount', '4998.00')
            ->assertJsonCount(1, 'data.items');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'total_amount' => '4998.00',
            'status' => Order::STATUS_PENDING,
        ]);
    }

    public function test_order_creation_rolls_back_when_stock_is_insufficient(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['stock' => 5]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/orders', [
            'shipping_address' => 'Esenler, Istanbul',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 6],
            ],
        ]);

        $response->assertStatus(422);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 5,
        ]);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_user_can_cancel_pending_order_and_restore_stock(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['price' => '1500.00', 'stock' => 10]);

        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/orders', [
            'shipping_address' => 'Esenler, Istanbul',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ])->assertStatus(201);

        $orderId = $createResponse->json('data.id');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 7,
        ]);

        $cancelResponse = $this->postJson("/api/orders/{$orderId}/cancel");

        $cancelResponse->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_CANCELLED);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 10,
        ]);

        $this->postJson("/api/orders/{$orderId}/cancel")
            ->assertStatus(422);
    }

    public function test_user_cannot_view_or_cancel_another_users_order(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $product = $this->createProduct(['stock' => 10]);

        Sanctum::actingAs($owner);

        $orderId = $this->postJson('/api/orders', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ])->assertStatus(201)->json('data.id');

        Sanctum::actingAs($otherUser);

        $this->getJson("/api/orders/{$orderId}")->assertNotFound();
        $this->postJson("/api/orders/{$orderId}/cancel")->assertNotFound();
    }

    public function test_user_can_pay_pending_order_and_cannot_cancel_paid_order(): void
    {
        $user = User::factory()->create();
        $product = $this->createProduct(['price' => '1000.00', 'stock' => 10]);

        Sanctum::actingAs($user);

        $orderId = $this->postJson('/api/orders', [
            'shipping_address' => 'Esenler, Istanbul',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])->assertStatus(201)->json('data.id');

        $this->postJson("/api/orders/{$orderId}/pay")
            ->assertOk()
            ->assertJsonPath('data.status', Order::STATUS_PAID);

        $this->postJson("/api/orders/{$orderId}/pay")
            ->assertStatus(422);

        $this->postJson("/api/orders/{$orderId}/cancel")
            ->assertStatus(422);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);
    }
}