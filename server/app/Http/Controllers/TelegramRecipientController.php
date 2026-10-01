<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TelegramRecipient;
use App\Services\TelegramService;

class TelegramRecipientController extends Controller
{
    #GET /api/telegram-recipients -- hanya admin
    public function index(){
        return response()->json(TelegramRecipient::all());
    }

    #POST /api/telegram-recipients --hanya admin
    public function store(Request $request){
        $validated = $request->validate([
            'telegram_chat_id' => 'required|string|unique:telegram_recipients,telegram_chat_id',
            'name' => 'required|string|max:255',
        ]);

        $recipient = TelegramRecipient::create($validated);

        return response()->json($recipient, 201);
    }

    #PUT /api/telegram-recipients --hanya admin
    public function update(Request $request, string $id){
        $recipient = TelegramRecipient::find($id);

        if (! $recipient){
            return response()->json(['message' => 'Penerima tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'is_active' => 'sometimes|required|boolean',
        ]);

        $recipient->update($validated);

        return response()->json($recipient);
    }

    #DELETE /api/telegram-recipients/{id} --hanya admin
    public function destroy(string $id){
        $recipient = TelegramRecipient::find($id);

        if (! $recipient){
            return response()->json(['message' => 'Penerima tidak ditemukan.']);
        }

        $recipient->delete();

        return response()->json(['message' => 'Berhasil menghapus penerima']);
    }

    #ENDPOINT kirim pesan uji coba
    public function test(Request $request){
        $sent = (new TelegramService())->sendAlert('Ini pesan uji dari SupermamaFarm. Jika kamu menerima ini notifikasi Telegram berjalan dengan baik.');

        return response()->json(['sent' => $sent]);
    }
}
