<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $this->orderService->listForUser($request->user());

        return OrderResource::collection($orders);
    }

    public function show(Request $request, int $id): OrderResource
    {
        $order = $this->orderService->findForUser($request->user(), $id);

        return new OrderResource($order);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->create($request->user(), $request->validated());

        return (new OrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function cancel(Request $request, int $id): OrderResource
    {
        $order = $this->orderService->cancel($request->user(), $id);

        return new OrderResource($order);
    }

    public function pay(Request $request, int $id): OrderResource
    {
        $validated = $request->validate([
            'sandbox_outcome' => ['nullable', 'in:success,declined'],
            'card_last4' => ['nullable', 'regex:/^\d{4}$/'],
        ]);

        $order = $this->orderService->pay(
            user: $request->user(),
            orderId: $id,
            outcome: $validated['sandbox_outcome'] ?? 'success',
            cardLast4: $validated['card_last4'] ?? null,
        );

        return new OrderResource($order);
    }
}