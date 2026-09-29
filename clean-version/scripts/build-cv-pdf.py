"""Render the shared CV content to public/cv.pdf; requires ReportLab.

The website build publishes this checked-in PDF without adding Python dependencies.
Regenerate after editing content/cv.json, then visually review the resulting pages.
"""
from pathlib import Path
import json
import os
from html import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable

ROOT = Path(__file__).resolve().parent.parent
cv = json.loads((ROOT / 'content/cv.json').read_text())
OUTPUT = ROOT / 'public/cv.pdf'
INK = colors.HexColor('#414141')
MUTED = colors.HexColor('#666666')
WIDTH = 528
GUTTER = 90
CONTENT = WIDTH - GUTTER
font_dir = Path(os.environ.get('CV_FONT_DIR', '/usr/share/fonts/truetype/liberation'))
for name, suffix in [('CVSans', 'Regular'), ('CVSans-Bold', 'Bold'), ('CVSans-Italic', 'Italic'), ('CVSans-BoldItalic', 'BoldItalic')]:
    pdfmetrics.registerFont(TTFont(name, str(font_dir / f'LiberationSans-{suffix}.ttf')))
pdfmetrics.registerFontFamily('CVSans', normal='CVSans', bold='CVSans-Bold', italic='CVSans-Italic', boldItalic='CVSans-BoldItalic')
styles = {
    'name': ParagraphStyle('name', fontName='CVSans-Bold', fontSize=25, leading=29, textColor=colors.HexColor('#1a1a1a')),
    'subtitle': ParagraphStyle('subtitle', fontName='CVSans', fontSize=12, leading=17, textColor=colors.HexColor('#737373')),
    'body': ParagraphStyle('body', fontName='CVSans', fontSize=10.2, leading=14, textColor=INK),
    'contact': ParagraphStyle('contact', fontName='CVSans', fontSize=9, leading=13, textColor=INK),
    'heading': ParagraphStyle('heading', fontName='CVSans', fontSize=18, leading=22, textColor=INK, spaceBefore=10, spaceAfter=7, keepWithNext=True),
    'entry': ParagraphStyle('entry', fontName='CVSans', fontSize=10.2, leading=13, textColor=INK),
    'description': ParagraphStyle('description', fontName='CVSans', fontSize=9.2, leading=12, textColor=MUTED, spaceBefore=2),
    'date': ParagraphStyle('date', fontName='CVSans', fontSize=7.4, leading=13, textColor=MUTED, alignment=TA_RIGHT),
}

def para(text, style='body'):
    return Paragraph(text, styles[style])

def indent(content, date=''):
    table = Table([[para(escape(date), 'date'), content]], colWidths=[GUTTER, CONTENT])
    table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (0, -1), 15), ('RIGHTPADDING', (1, 0), (1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
    return table

def link(url, label):
    return f'<link href="{escape(url, quote=True)}" color="#414141">{escape(label)}</link>'

story = []
intro = escape(cv['intro'])
for phrase, bg, fg in [('machine learning', '#bbf6e2', '#286b55'), ('platform engineering', '#c1e7fa', '#265d7b'), ('technical program management', '#ffd7f1', '#85446f')]:
    intro = intro.replace(phrase, f'<font backColor="{bg}" color="{fg}"><b> {phrase} </b></font>')
contacts = Table([[
    para('<br/>'.join([link(cv['website'], 'jordanbailey.dev'), link('mailto:' + cv['email'], cv['email']), link(cv['website'] + 'cv.pdf', 'CV PDF')]), 'contact'),
    para('<br/>'.join([link(cv['github'], '@jordanbailey00'), link(cv['linkedin'], 'jordanbaileypm')]), 'contact')
]], colWidths=[CONTENT / 2, CONTENT / 2])
contacts.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), 0)]))
story.append(indent([para(escape(cv['name']), 'name'), para(escape(cv['subtitle']), 'subtitle'), Spacer(1, 10), para(intro), Spacer(1, 14), contacts, Spacer(1, 17), HRFlowable(width='100%', thickness=.5, color=colors.HexColor('#dddddd')), Spacer(1, 8)]))

for section in cv['sections']:
    heading = indent(para(escape(section['title']), 'heading'))
    entries = []
    for entry in section['entries']:
        title = escape(entry['primary'])
        content = [para(title if section['id'] == 'honors-and-awards' else '<b>' + title + '</b>', 'entry')]
        if entry.get('secondary'):
            secondary = escape(entry['secondary'])
            content.append(para('<i>' + secondary + '</i>' if section['id'] == 'teaching' else secondary, 'entry'))
        if entry.get('position'):
            content.append(para('<i>' + escape(entry['position']) + '</i>', 'entry'))
        content.extend(para(escape(text), 'description') for text in entry['description'])
        entries.append(indent(content, entry['date']))
    skills = section.get('skills', [])
    if entries:
        story.append(KeepTogether([heading, entries[0], Spacer(1, 8)]))
        for entry in entries[1:]:
            story.extend([entry, Spacer(1, 8)])
    elif skills:
        content = [para('<b>' + escape(item['category']) + ':</b> ' + escape(item['skills'])) for item in skills]
        story.append(KeepTogether([heading, indent(content), Spacer(1, 8)]))
    else:
        # Deliberately blank: the reference's section stays visible for future updates.
        story.append(KeepTogether([heading, Spacer(1, 10)]))

def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('CVSans', 8)
    canvas.setFillColor(colors.HexColor('#888888'))
    canvas.drawString(42 + GUTTER, 24, 'Jordan Bailey')
    canvas.drawRightString(570, 24, str(doc.page))
    canvas.restoreState()

OUTPUT.parent.mkdir(exist_ok=True)
doc = SimpleDocTemplate(str(OUTPUT), pagesize=letter, rightMargin=42, leftMargin=42, topMargin=30, bottomMargin=42, title='Jordan Bailey - Curriculum Vitae', author='Jordan Bailey', subject='Education, experience, and technology skills')
doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
print(OUTPUT)
