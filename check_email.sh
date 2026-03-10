#!/bin/bash
#
# Check email logs and SMTP settings
#

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Email Diagnostics                                         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "1. SMTP SETTINGS IN .ENV"
echo "═══════════════════════════════════════════════════════════════"
grep -E "^SMTP_|^EMAIL_" /opt/ezloadndump/.env | sed 's/SMTP_PASS=.*/SMTP_PASS=****HIDDEN****/'

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "2. SERVICE LOGS (last 50 lines - looking for email errors)"
echo "═══════════════════════════════════════════════════════════════"
journalctl -u ezloadndump -n 50 --no-pager | grep -i -E "email|smtp|mail|error|auth"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "3. FULL RECENT LOGS"
echo "═══════════════════════════════════════════════════════════════"
journalctl -u ezloadndump -n 30 --no-pager

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "DONE"
echo "═══════════════════════════════════════════════════════════════"
