<?php

namespace App\Services\Payments;

readonly class PaymentResult
{
    public function __construct(
        public bool $successful,
        public string $provider,
        public string $transactionId,
        public string $message,
        public ?string $cardLast4 = null,
    ) {
    }
}

interface PaymentGatewayInterface
{
    public function charge(
        int $orderId,
        string $amount,
        string $outcome = 'success',
        ?string $cardLast4 = null,
    ): PaymentResult;
}