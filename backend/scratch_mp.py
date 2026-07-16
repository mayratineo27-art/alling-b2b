import mercadopago

access_token = "TEST-APP_USR-4481961145930337-062915-05a0e104363746cb2660ce18a05a2cd2-3507225266"
sdk = mercadopago.SDK(access_token)

preference_data = {
    "items": [
        {
            "title": "Pedido test",
            "quantity": 1,
            "unit_price": 100.50,
            "currency_id": "PEN"
        }
    ],
    "external_reference": "test-123",
    "back_urls": {
        "success": "http://localhost/success",
        "pending": "http://localhost/pending",
        "failure": "http://localhost/failure",
    },
    "auto_return": "approved",
}

preference_response = sdk.preference().create(preference_data)
print(preference_response)
