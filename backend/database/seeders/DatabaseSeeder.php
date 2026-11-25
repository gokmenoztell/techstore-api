<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@techstore.local'],
            [
                'name' => 'Admin',
                'password' => Hash::make('Admin1234!'),
                'role' => User::ROLE_ADMIN,
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@techstore.local'],
            [
                'name' => 'Musteri',
                'password' => Hash::make('User1234!'),
                'role' => User::ROLE_CUSTOMER,
            ]
        );

        $products = [
            [
                'name' => 'Mekanik Klavye',
                'description' => 'Kablosuz mekanik oyuncu klavyesi.',
                'price' => 2499.00,
                'stock' => 25,
                'is_active' => true,
            ],
            [
                'name' => 'Kablosuz Mouse',
                'description' => 'Hafif ve yüksek DPI kablosuz mouse.',
                'price' => 1499.00,
                'stock' => 40,
                'is_active' => true,
            ],
            [
                'name' => 'Oyuncu Kulakligi',
                'description' => 'Net mikrofonlu kulak üstü kulaklık.',
                'price' => 2999.00,
                'stock' => 15,
                'is_active' => true,
            ],
        ];

        foreach ($products as $item) {
            $slug = Str::slug($item['name']);
            Product::updateOrCreate(
                ['slug' => $slug],
                array_merge($item, ['slug' => $slug])
            );
        }
    }
}