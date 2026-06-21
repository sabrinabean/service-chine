# 法语化翻译清单(FR)

> 站点目标语言:**法语单语**(`<html lang="fr">`)。本文档分两部分:
> - **A. 已完成的确定性翻译**(结构/通用 UI,无需决策,已 build 验证)
> - **B. 待确认的业务文案**(营销/法律口吻,需你拍板措辞后我再填)

---

## A. 已完成(✅ build 通过)

| 位置 | 原文(EN) | 译文(FR) |
|---|---|---|
| `consts.ts` NAV_MENU | Home / About us / Service / Team / Blog / Contact | Accueil / À propos / Services / Équipe / Blog / Contact |
| `consts.ts` SITE_DESCRIPTION | Specialized, efficient, and thorough cleaning services | Services de nettoyage spécialisés, efficaces et minutieux |
| `Header.astro` / `Drawer.astro` | Get a quote | Demander un devis |
| `Drawer.astro` sr-only | Open menu | Ouvrir le menu |
| `Main.astro` | `<html lang="en">` | `<html lang="fr">` |
| `utils/date.ts` | `en-US` + " at " | `fr-FR` + " à " |
| `FormattedDate.astro` | `en-us` | `fr-FR` |
| `BlogPost.astro` | Home / Last updated on / Go Back / Latest Post | Accueil / Mis à jour le / Retour / Derniers articles |
| `NewsCard*.astro`(×3) | Read more | Lire la suite |
| `Footer.astro` | “Procleaning” All Rights Received | « Procleaning » — Tous droits réservés |
| 面包屑(policy/terms/service/team/blog) | Home / Privacy Policy / Terms & Conditions / Service / Team | Accueil / Politique de confidentialité / Conditions générales / Services / Équipe |

---

## B. 待确认的业务文案(营销/法律口吻)

> 以下文案涉及**品牌口吻、服务定位、法律准确性**,建议你确认措辞后我再写入。
> 我给出**建议法文译法**作为起点,你可逐条调整。标注 ⚠️ 的是需要特别注意的。

### B1. 首页 Hero(`homepage/Hero.astro`)
| EN | 建议 FR | 备注 |
|---|---|---|
| Specialized, efficient, and thorough cleaning services | Services de nettoyage spécialisés, efficaces et minutieux | (已用于 SITE_DESCRIPTION) |
| Quality cleaning at a fair price. | Un nettoyage de qualité à un prix juste. | hero 副标题 |
| Get Start Now | Commencer maintenant | CTA 按钮 |
| View all Services | Voir tous les services | CTA 按钮 |

### B2. Sec1(`homepage/Sec1.astro`)
| EN | 建议 FR |
|---|---|
| High-Quality and Friendly Services at Fair Prices | Des services de haute qualité et conviviaux à des prix justes |
| Affordable cleaning solutions | Des solutions de nettoyage abordables |
| Get a quote | Demander un devis |

### B3. Welcome(`homepage/Welcome.astro`)
| EN | 建议 FR |
|---|---|
| Welcome To Our Pro-cleaning Company! | Bienvenue chez ProCleaning ! |
| Best Quality | Meilleure qualité |
| Affordable Prices | Prix abordables |
| Vetted professionals | Professionnels vérifiés |
| Standard cleaning tasks | Tâches de nettoyage standard |
| Next day availability | Disponibilité dès le lendemain |
| Know More | En savoir plus |
| Book Now | Réserver maintenant |

### B4. Services(`homepage/Services.astro`)
| EN | 建议 FR |
|---|---|
| We always provide the best service | Nous offrons toujours le meilleur service |
| All services | Tous les services |

### B5. Plan(`homepage/Plan.astro`)— 定价套餐 ⚠️(术语多,需逐条确认)
| EN | 建议 FR |
|---|---|
| Our Pricing | Nos tarifs |
| Choose From Our Lowest Plans and Prices | Choisissez parmi nos formules et prix les plus bas |
| Monthly / Yearly | Mensuel / Annuel |
| Basic Package / Premium Package / Enterprise Package | Formule Basique / Formule Premium / Formule Entreprise |
| Book Now | Réserver maintenant |
| All services in the Basic Plan / Clean Plan | Tous les services de la formule Basique / Clean |
| Dusting of all surfaces | Dépoussiérage de toutes les surfaces |
| Detailed dusting | Dépoussiérage détaillé |
| Vacuuming carpets and rugs | Aspiration des tapis et moquettes |
| Sweeping and mopping floors | Balayage et lavage des sols |
| Cleaning of kitchen surfaces | Nettoyage des surfaces de cuisine |
| Cleaning of bathroom surfaces | Nettoyage des surfaces de salle de bain |
| Detailed bathroom cleaning | Nettoyage détaillé de la salle de bain |
| Wiping down of kitchen appt | Nettoyage des appareils de cuisine |
| Deep cleaning of kitchen appt | Nettoyage en profondeur des appareils de cuisine |
| Cleaning inside the microwave | Nettoyage intérieur du micro-ondes |
| Emptying trash bins | Vidage des poubelles |
| Changing bed linens | Changement des draps |
| Carpet, upholstery spot cleaning | Nettoyage localisé tapis et tissus |
| Baseboards, door frames, & vents | Plinthes, cadres de porte et bouches d'aération |
| Spot cleaning walls and doors | Nettoyage localisé murs et portes |
| Organization of closets pantries | Rangement des placards et garde-manger |

### B6. Team(`homepage/Team.astro`)
| EN | 建议 FR |
|---|---|
| Expert Team | Équipe d'experts |
| All team | Toute l'équipe |

### B7. Feedback(`homepage/Feedback.astro`)⚠️(占位人名/头衔)
| EN | 建议 FR |
|---|---|
| Feedback About Their Experience With Us | Ce qu'ils disent de leur expérience avec nous |
| Business Man | Homme d'affaires |
| Robert Fox | Robert Fox(占位人名,替换为真实客户证言) |

### B8. News(`homepage/News.astro`)
| EN | 建议 FR |
|---|---|
| Stay Updated with Our Tips & Service News! | Restez informé de nos conseils et actualités ! |
| Our Blog | Notre blog |
| All news | Toutes les actualités |

### B9. Contacts(`homepage/Contacts.astro`)⚠️(联系信息占位)
| EN | 建议 FR |
|---|---|
| Keep In Touch | Restons en contact |
| Contact info | Coordonnées |
| Find us | Nous trouver |
| Address | Adresse |
| Call Us | Appelez-nous |
| Email Now | Envoyer un e-mail |
| Hello@procleaning.com | ⚠️ 替换为真实邮箱 |
| Required | Obligatoire |
| Sent Massage | Envoyer le message ⚠️(原文 "Massage" 是 "Message" 的拼写错误) |

### B10. 法律页(`terms.astro` / `policy.astro`)⚠️
- 这两页是英文法律模板(terms 21 处 / policy 15 处文案)。
- ⚠️ **法律文案不建议机翻** —— 建议提供法语版条款原文,或由法务确认措辞后替换。当前可先翻译标题与小标题,正文条款保留待定。

### B11. 内容(blog/service/team 的 `.md`)⚠️
- 现有 11 篇 demo 内容是英文(清洁服务占位文本)。
- ⚠️ 这些需替换为你的**真实法语业务内容**,不是翻译 demo。Keystatic 上线后由编辑者直接填法语内容即可。

---

## 处理方式建议

1. **B1–B9**:如果你认可上表的"建议 FR",我直接批量写入(半小时内完成 + build 验证)。个别要改的,你圈出来。
2. **B10 法律页**:建议你提供法语条款,或确认"暂用法语标题 + 英文正文占位"。
3. **B11 内容**:Keystatic 上线后编辑者填真实内容,不翻译 demo。

> 品牌名 ⚠️:当前仍用占位 `ProCleaning` / `Procleaning`。确认正式品牌名后,我全局替换(影响 SITE_TITLE、Footer、Hero 等)。
