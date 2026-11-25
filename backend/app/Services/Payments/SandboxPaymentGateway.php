<?php

namespace App\Services\Payments;

use Illuminate\Support\Str;

class SandboxPaymentGateway implements PaymentGatewayInterface
{
    public function charge(
        int $orderId,
        string $amount,
        string $outcome = 'success',
        ?string $cardLast4 = null,
    ): PaymentResult {
        $resolvedLast4 = $cardLast4 ?: '4242';
        $transactionId = 'sbx_tx_' . Str::lower(Str::random(12));

        // Karttan çekim yapılmadan reddedilen kart / yetersiz limit simülasyonu
        if ($outcome === 'declined' || $resolvedLast4 === '0002') {
            return new PaymentResult(
                successful: false,
                provider: 'sandbox',
                transactionId: $transactionId,
                message: 'Sandbox ödeme reddedildi: test kartı limit/bakiye yetersiz (çekim yapılmadı).',
                cardLast4: $resolvedLast4,
            );
        }

        return new PaymentResult(
            successful: true,
            provider: 'sandbox',
            transactionId: $transactionId,
            message: "Sandbox test tahsilatı onaylandı ({$amount} TL).",
            cardLast4: $resolvedLast4,
        );
    }
}