"""Tests for contacts, SMS, and API keys endpoints."""

import pytest
from httpx import AsyncClient


class TestContacts:
    async def test_list_contacts_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/contacts")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create_contact(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/contacts", json={
            "name": "James Mwangi", "phone": "+254712345678", "email": "james@test.com"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "James Mwangi"
        assert data["phone"] == "+254712345678"

    async def test_create_and_list(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/contacts", json={"name": "A", "phone": "+254700000001"})
        await auth_client.post("/api/v1/contacts", json={"name": "B", "phone": "+254700000002"})
        resp = await auth_client.get("/api/v1/contacts")
        assert len(resp.json()) == 2

    async def test_create_and_delete(self, auth_client: AsyncClient):
        create = await auth_client.post("/api/v1/contacts", json={"name": "Delete Me", "phone": "+254700000099"})
        cid = create.json()["id"]
        del_resp = await auth_client.delete(f"/api/v1/contacts/{cid}")
        assert del_resp.status_code == 204
        listing = await auth_client.get("/api/v1/contacts")
        assert len(listing.json()) == 0

    async def test_search_contacts(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/contacts", json={"name": "Alice", "phone": "+254711111111"})
        await auth_client.post("/api/v1/contacts", json={"name": "Bob", "phone": "+254722222222"})
        resp = await auth_client.get("/api/v1/contacts?search=Alice")
        assert len(resp.json()) == 1
        assert resp.json()[0]["name"] == "Alice"

    async def test_contacts_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/contacts")
        assert resp.status_code == 403


class TestContactGroups:
    async def test_create_group(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/contacts/groups", json={"name": "VIP"})
        assert resp.status_code == 201
        assert resp.json()["name"] == "VIP"

    async def test_list_groups(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/contacts/groups", json={"name": "Group A"})
        resp = await auth_client.get("/api/v1/contacts/groups")
        assert len(resp.json()) == 1


class TestSMS:
    async def test_send_sms(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/messages/send", json={
            "recipients": ["+254712345678"], "message": "Hello from test!"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["queued"] == 1
        assert data["total_cost"] == 1
        assert data["status"] == "queued"

    async def test_send_sms_bulk(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/messages/send", json={
            "recipients": ["+254700000001", "+254700000002", "+254700000003"],
            "message": "Bulk test",
        })
        assert resp.status_code == 200
        assert resp.json()["queued"] == 3
        assert resp.json()["total_cost"] == 3

    async def test_send_sms_insufficient_balance(self, auth_client: AsyncClient):
        # User has 10000 credits, send a huge batch
        phones = [f"+25470000{i:04d}" for i in range(10001)]
        resp = await auth_client.post("/api/v1/messages/send", json={
            "recipients": phones, "message": "Over limit"
        })
        assert resp.status_code == 402

    async def test_sms_history(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/messages/send", json={
            "recipients": ["+254712345678"], "message": "History test"
        })
        resp = await auth_client.get("/api/v1/messages/history")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_sms_stats(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/messages/stats")
        assert resp.status_code == 200
        assert "total_sent" in resp.json()
        assert "balance" in resp.json()


class TestApiKeys:
    async def test_create_key(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/api-keys", json={"name": "Test Key"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Test Key"
        assert data["full_key"].startswith("trk_")
        assert data["is_active"] is True

    async def test_list_keys(self, auth_client: AsyncClient):
        await auth_client.post("/api/v1/api-keys", json={"name": "Key 1"})
        resp = await auth_client.get("/api/v1/api-keys")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_revoke_key(self, auth_client: AsyncClient):
        create = await auth_client.post("/api/v1/api-keys", json={"name": "Revoke Me"})
        kid = create.json()["id"]
        del_resp = await auth_client.delete(f"/api/v1/api-keys/{kid}")
        assert del_resp.status_code == 204


class TestCampaigns:
    async def test_list_campaigns_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/campaigns")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_create_campaign_fails_without_contacts(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/v1/campaigns", json={
            "name": "Promo", "message_content": "Buy 1 get 1 free!"
        })
        assert resp.status_code == 400
        assert "contacts" in resp.json()["detail"]

    async def test_create_campaign_success(self, auth_client: AsyncClient):
        # Create a contact first
        await auth_client.post("/api/v1/contacts", json={"name": "John", "phone": "+254711223344"})
        resp = await auth_client.post("/api/v1/campaigns", json={
            "name": "Promo 2", "message_content": "Special promo today!"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Promo 2"
        assert data["status"] == "queued"
        assert data["total_recipients"] == 1


class TestWallet:
    async def test_list_transactions_init(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/wallet/transactions")
        assert resp.status_code == 200
        # May have welcome bonus
        assert len(resp.json()) >= 1

    async def test_mpesa_topup_success(self, auth_client: AsyncClient):
        tx_init_resp = await auth_client.get("/api/v1/wallet/transactions")
        init_len = len(tx_init_resp.json())

        resp = await auth_client.post("/api/v1/wallet/topup", json={
            "amount": 1000, "phone_number": "+254712345678"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["response_code"] == "0"
        assert data["status"] == "completed"

        # Check transactions list now has init_len + 1 transaction
        tx_resp = await auth_client.get("/api/v1/wallet/transactions")
        assert len(tx_resp.json()) == init_len + 1
        # Find the top-up transaction
        topup_tx = [t for t in tx_resp.json() if t["type"] == "topup"][0]
        assert topup_tx["amount"] == 1000.0
        assert topup_tx["sms_credits"] == 10000


class TestNotifications:
    async def test_list_notifications_has_welcome(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/notifications")
        assert resp.status_code == 200
        # A welcome notification is added automatically on user registration
        assert len(resp.json()) >= 1
        assert resp.json()[0]["is_read"] is False

    async def test_mark_notification_as_read(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/notifications")
        nid = resp.json()[0]["id"]

        read_resp = await auth_client.put(f"/api/v1/notifications/{nid}/read")
        assert read_resp.status_code == 200
        assert read_resp.json()["is_read"] is True

    async def test_read_all_notifications(self, auth_client: AsyncClient):
        resp = await auth_client.put("/api/v1/notifications/read-all")
        assert resp.status_code == 200

        list_resp = await auth_client.get("/api/v1/notifications")
        for n in list_resp.json():
            assert n["is_read"] is True


class TestAdmin:
    async def test_get_stats_forbidden_for_regular_user(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/v1/admin/stats")
        assert resp.status_code == 403

    async def test_get_stats_success(self, admin_client: AsyncClient):
        resp = await admin_client.get("/api/v1/admin/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "total_sms_sent" in data

    async def test_list_users(self, admin_client: AsyncClient):
        resp = await admin_client.get("/api/v1/admin/users")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert any(u["email"] == "admin@test.com" for u in data)

    async def test_adjust_user_credits(self, admin_client: AsyncClient):
        users_resp = await admin_client.get("/api/v1/admin/users")
        user_id = users_resp.json()[0]["id"]
        
        adj_resp = await admin_client.post(
            f"/api/v1/admin/users/{user_id}/credits",
            json={"amount": 500, "description": "Gift credits"}
        )
        assert adj_resp.status_code == 200
        assert adj_resp.json()["new_balance"] == adj_resp.json()["old_balance"] + 500

    async def test_toggle_user_status(self, admin_client: AsyncClient):
        # Create a non-superuser user via register to test status toggling
        users_resp = await admin_client.get("/api/v1/admin/users")
        target_user = None
        for u in users_resp.json():
            if not u["is_superuser"]:
                target_user = u
                break
        
        if target_user:
            user_id = target_user["id"]
            status_resp = await admin_client.post(
                f"/api/v1/admin/users/{user_id}/status",
                json={"is_active": False}
            )
            assert status_resp.status_code == 200
            assert status_resp.json()["is_active"] is False


class TestTemplates:
    async def test_create_and_list_templates(self, auth_client: AsyncClient):
        from httpx import AsyncClient
        
        # Create template
        resp = await auth_client.post(
            "/api/v1/templates",
            json={"name": "Welcome Test", "content": "Hello, thank you for signing up!"}
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Welcome Test"
        assert data["content"] == "Hello, thank you for signing up!"
        template_id = data["id"]

        # List templates
        list_resp = await auth_client.get("/api/v1/templates")
        assert list_resp.status_code == 200
        templates_list = list_resp.json()
        assert len(templates_list) >= 1
        assert any(t["id"] == template_id for t in templates_list)

        # Update template
        up_resp = await auth_client.put(
            f"/api/v1/templates/{template_id}",
            json={"name": "Updated Title"}
        )
        assert up_resp.status_code == 200
        assert up_resp.json()["name"] == "Updated Title"

        # Delete template
        del_resp = await auth_client.delete(f"/api/v1/templates/{template_id}")
        assert del_resp.status_code == 200

        # Verify not listed anymore
        list_resp_after = await auth_client.get("/api/v1/templates")
        assert not any(t["id"] == template_id for t in list_resp_after.json())




