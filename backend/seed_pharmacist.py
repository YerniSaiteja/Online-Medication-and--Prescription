from app import app, db, User, generate_password_hash

with app.app_context():
    if not User.query.filter_by(email='pharma@test.com').first():
        pharma = User(
            full_name='Test Pharmacist',
            email='pharma@test.com',
            password_hash=generate_password_hash('password123'),
            role='pharmacist',
            phone='1234567890'
        )
        db.session.add(pharma)
        db.session.commit()
        print("Pharmacist user created.")
    else:
        print("Pharmacist user already exists.")
