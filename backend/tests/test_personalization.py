import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.contact import Contact
from app.services.campaign_worker import compile_template


@pytest.mark.anyio
async def test_contact_custom_attributes_db_storage(db_session: AsyncSession):
    # Setup user
    user = User(email="personalize@test.com", full_name="Personalize User", hashed_password="x")
    db_session.add(user)
    await db_session.flush()

    # Create contact with custom attributes
    attrs = {
        "amount_due": "KES 14,200",
        "due_date": "15th July 2026",
        "invoice_no": "INV-2026-99"
    }
    contact = Contact(
        user_id=user.id,
        phone="+254712345678",
        name="John Doe",
        email="john@doe.com",
        custom_attributes=attrs
    )
    db_session.add(contact)
    await db_session.flush()
    await db_session.refresh(contact)

    # Verify attributes stored correctly and retrieved
    assert contact.id is not None
    assert contact.custom_attributes == attrs
    assert contact.custom_attributes["due_date"] == "15th July 2026"


def test_template_compiler_resolution():
    # Setup a mock contact model structure
    class MockContact:
        def __init__(self, name, phone, email, notes, custom_attributes):
            self.name = name
            self.phone = phone
            self.email = email
            self.notes = notes
            self.custom_attributes = custom_attributes

    contact = MockContact(
        name="Alice Mwangi",
        phone="+254700000000",
        email="alice@mwangi.com",
        notes="Vip Customer",
        custom_attributes={
            "balance": "KES 3,250",
            "DueDate": "20th July",
            "account_manager": "Kevin"
        }
    )

    # Test standard variables
    t1 = "Hello {{name}}, your phone is {{phone}}."
    assert compile_template(t1, contact) == "Hello Alice Mwangi, your phone is +254700000000."

    # Test custom attributes (exact and case-insensitive keys)
    t2 = "Balance: {{balance}}, Due date: {{DueDate}}"
    assert compile_template(t2, contact) == "Balance: KES 3,250, Due date: 20th July"

    # Test fallback default filters
    t3 = "Hi {{name | default='Friend'}}, meet {{account_manager | default='Support'}}."
    assert compile_template(t3, contact) == "Hi Alice Mwangi, meet Kevin."

    t4 = "Hello {{missing_field | default='Valued Customer'}}, how are you?"
    assert compile_template(t4, contact) == "Hello Valued Customer, how are you?"

    # Test empty or missing fields default behavior
    t5 = "Test {{non_existent}} value."
    assert compile_template(t5, contact) == "Test  value."
