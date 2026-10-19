<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('kandang.{id}', fn ($user, $id) => $user !== null);
Broadcast::channel('alerts.global', fn ($user) => $user !== null);
#('App.Models.User.{id}', function ($user, $id) {
    #return (int) $user->id === (int) $id;
#});
