import io
import pytest
from httpx import AsyncClient
import openpyxl

@pytest.mark.asyncio
async def test_contacts_import_csv(auth_client: AsyncClient):
    csv_data = "name,phone,email\nJohn Doe,+254712345678,john@example.com\n"
    files = {"file": ("contacts.csv", csv_data, "text/csv")}
    resp = await auth_client.post("/api/v1/contacts/import", files=files)
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "queued"
    assert "import_id" in data

@pytest.mark.asyncio
async def test_contacts_import_xlsx(auth_client: AsyncClient):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["name", "phone", "email"])
    ws.append(["Jane Excel", "+254722334455", "jane@example.com"])
    
    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    
    files = {"file": ("contacts.xlsx", out.read(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    resp = await auth_client.post("/api/v1/contacts/import", files=files)
    assert resp.status_code == 202
    data = resp.json()
    assert data["status"] == "queued"
    assert "import_id" in data

@pytest.mark.asyncio
async def test_contacts_import_invalid_extension(auth_client: AsyncClient):
    files = {"file": ("contacts.txt", "some plain text data", "text/plain")}
    resp = await auth_client.post("/api/v1/contacts/import", files=files)
    assert resp.status_code == 400
    assert "Invalid file format" in resp.json()["detail"]
