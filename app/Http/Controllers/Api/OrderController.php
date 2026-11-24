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
}