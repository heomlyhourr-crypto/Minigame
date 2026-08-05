import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CallbackQueryHandler, ContextTypes
import requests

# កំណត់ Token របស់ Bot អ្នក
BOT_TOKEN = "8840822540:AAHA_Tu065Ham9PIrp7BJS13wntlujoglqI"
FIREBASE_URL = "https://mini-shopping-9582e-default-rtdb.firebaseio.com"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data  # ឧទាហរណ៍: deposit_accept_6995747279_10000 ឬ withdraw_reject_...
    parts = data.split("_")
    action_type = parts[0]      # deposit ឬ withdraw
    status_action = parts[1]    # accept ឬ reject
    user_id = int(parts[2])     # User Chat ID
    amount = int(parts[3])

    user_ref_url = f"{FIREBASE_URL}/users/{user_id}.json"
    
    # ទាញទិន្នន័យ User បច្ចុប្បន្នពី Firebase
    res = requests.get(user_ref_url)
    user_data = res.json() if res.status_code == 200 else None
    current_balance = user_data.get("balance", 0) if user_data else 0

    # មុខងារជំនួយសម្រាប់ផ្ញើសារទៅ User ផ្ទាល់
    def send_user_alert(chat_id, text):
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        requests.post(url, json=payload)

    if action_type == "deposit":
        if status_action == "accept":
            # Admin យល់ព្រមបញ្ចូលប្រាក់ -> បន្ថែមលុយឱ្យ User ដោយស្វ័យប្រវត្តិ
            new_balance = current_balance + amount
            requests.patch(user_ref_url, json={"balance": new_balance})
            
            # អាប់ដេតសាររបស់ Admin
            await query.edit_message_text(
                text=f"{query.message.text}\n\n✅ <b>ស្ថានភាព:</b> បានយល់ព្រមបញ្ចូលប្រាក់ចំនួន {amount:,} ៛ ជូនអតិថិជនជោគជ័យ!",
                parse_mode="HTML"
            )
            
            # ផ្ញើសារ Alert ទៅអ្នកប្រើប្រាស់
            send_user_alert(user_id, f"🟢 <b>បានបញ្ចូលទឹកប្រាក់ចំនួន:</b> {amount:,} ៛ ដោយជោគជ័យ!")
            
        else:
            # Admin មិនយល់ព្រមបញ្ចូលប្រាក់
            await query.edit_message_text(
                text=f"{query.message.text}\n\n❌ <b>ស្ថានភាព:</b> មិនយល់ព្រមសំណើបញ្ចូលប្រាក់.",
                parse_mode="HTML"
            )
            
            # ផ្ញើសារ Alert ទៅអ្នកប្រើប្រាស់
            send_user_alert(user_id, f"❌ សំណើទឹកប្រាក់ចំនួន {amount:,} ៛ របស់អ្នកបរាជ័យ។")

    elif action_type == "withdraw":
        if status_action == "accept":
            # Admin យល់ព្រមដកប្រាក់ (លុយបានកាត់រួចស្រេចពេលដាក់សំណើ)
            await query.edit_message_text(
                text=f"{query.message.text}\n\n✅ <b>ស្ថានភាព:</b> បានអនុម័តការដកប្រាក់ជោគជ័យ!",
                parse_mode="HTML"
            )
            
            # ផ្ញើសារ Alert ទៅអ្នកប្រើប្រាស់
            send_user_alert(user_id, f"🟢 ការដកប្រាក់ចំនួន {amount:,} ៛ របស់អ្នកត្រូវបានអនុម័តជោគជ័យ!")
            
        else:
            # Admin មិនយល់ព្រមដកប្រាក់ -> សងប្រាក់ចូល Balance របស់ User វិញ
            new_balance = current_balance + amount
            requests.patch(user_ref_url, json={"balance": new_balance})
            
            await query.edit_message_text(
                text=f"{query.message.text}\n\n❌ <b>ស្ថានភាព:</b> មិនយល់ព្រម ( {amount:,} ៛).",
                parse_mode="HTML"
            )
            
            # ផ្ញើសារ Alert ទៅអ្នកប្រើប្រាស់
            send_user_alert(user_id, f"❌ សំណើទឹកប្រាក់ចំនួន {amount:,} ៛ របស់អ្នកបរាជ័យ។ (ប្រាក់ត្រូវបានសងចូលគណនីវិញ)")

app = ApplicationBuilder().token(BOT_TOKEN).build()
app.add_handler(CallbackQueryHandler(button_handler))

print("Bot is running and listening to button clicks...")
app.run_polling()
