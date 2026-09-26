/* =========================================================
   مقسوم — الملف المشترك
   يحتوي على: حفظ البيانات، الحسابات، والتحليل البسيط.
   يُستخدم في كل صفحات المشروع.
   ========================================================= */

const MAQSOUM_STORAGE_KEY = "maqsoum_data";

/* ظل خفيف للهيدر عند التمرير — لمظهر متناسق في كل الصفحات */
document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector(".site-header");
  if (!header) return;
  window.addEventListener(
    "scroll",
    function () {
      header.classList.toggle("is-scrolled", window.scrollY > 4);
    },
    { passive: true }
  );
});

/* ---------- حفظ واسترجاع بيانات التاجر ---------- */

function maqsoumSaveData(data) {
  localStorage.setItem(MAQSOUM_STORAGE_KEY, JSON.stringify(data));
}

function maqsoumLoadData() {
  const raw = localStorage.getItem(MAQSOUM_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function maqsoumClearData() {
  localStorage.removeItem(MAQSOUM_STORAGE_KEY);
}

/* ---------- تنسيق الأرقام ---------- */

function maqsoumFormatNumber(value, decimals = 0) {
  if (!isFinite(value)) return "0";
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function maqsoumFormatPercent(value) {
  if (!isFinite(value)) return "0%";
  return maqsoumFormatNumber(value, 1) + "%";
}

/* ---------- الحسابات الأساسية ----------
   data المتوقعة (كل الحقول أرقام، والافتراضي صفر):
   {
     capital, sales_revenue, orders_count,
     cost_suppliers, cost_distributors,
     shipping_cost, packaging_cost,
     marketing_cost, other_costs,
     saved_at
   }
------------------------------------------------- */

function maqsoumCalculateResults(data) {
  const num = (v) => (isFinite(v) && v > 0 ? Number(v) : 0);

  const revenue = num(data.sales_revenue);
  const ordersCount = num(data.orders_count);
  const capital = num(data.capital);

  const costItems = [
    { key: "cost_suppliers", label: "تكلفة الموردين", value: num(data.cost_suppliers) },
    { key: "cost_distributors", label: "الموزعين والعمولات", value: num(data.cost_distributors) },
    { key: "shipping_cost", label: "الشحن", value: num(data.shipping_cost) },
    { key: "packaging_cost", label: "التغليف", value: num(data.packaging_cost) },
    { key: "marketing_cost", label: "التسويق", value: num(data.marketing_cost) },
    { key: "other_costs", label: "مصاريف أخرى", value: num(data.other_costs) },
  ];

  const totalCosts = costItems.reduce((sum, item) => sum + item.value, 0);
  const netProfit = revenue - totalCosts;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const costPerOrder = ordersCount > 0 ? totalCosts / ordersCount : 0;

  // نسبة كل تكلفة من إجمالي المصاريف
  const costBreakdown = costItems.map((item) => ({
    ...item,
    percentOfCosts: totalCosts > 0 ? (item.value / totalCosts) * 100 : 0,
  }));

  // استرداد رأس المال
  let capitalRecoveryPercent = null;
  let capitalRemaining = null;
  if (capital > 0) {
    const recovered = Math.max(0, netProfit);
    capitalRecoveryPercent = Math.min(100, (recovered / capital) * 100);
    capitalRemaining = Math.max(0, capital - recovered);
  }

  return {
    revenue,
    totalCosts,
    netProfit,
    profitMargin,
    costPerOrder,
    ordersCount,
    capital,
    capitalRecoveryPercent,
    capitalRemaining,
    costBreakdown,
  };
}

/* ---------- تحليل بسيط للنتائج (قواعد ثابتة، بدون ذكاء اصطناعي) ---------- */

function maqsoumBuildAnalysis(results) {
  const notes = [];

  if (results.revenue === 0) {
    notes.push("لم تُدخل أي مبيعات بعد، فلا يمكن حساب هامش ربح دقيق.");
    return notes;
  }

  if (results.netProfit < 0) {
    notes.push(
      "تجارتك تعمل بخسارة حاليًا: التكاليف أعلى من المبيعات. راجع أكبر بند تكلفة أولًا."
    );
  } else if (results.profitMargin < 10) {
    notes.push(
      "هامش الربح منخفض (أقل من 10%). أي زيادة بسيطة في التكاليف قد تحوّل الربح إلى خسارة."
    );
  } else if (results.profitMargin < 25) {
    notes.push("هامش الربح مقبول، وهناك مجال لتحسينه بتقليل بعض التكاليف.");
  } else {
    notes.push("هامش الربح جيد مقارنة بمتوسط التجارة الإلكترونية.");
  }

  // أعلى بند تكلفة
  const sortedCosts = [...results.costBreakdown].sort((a, b) => b.value - a.value);
  const topCost = sortedCosts[0];
  if (topCost && topCost.value > 0) {
    notes.push(
      `أكبر بند في مصاريفك هو "${topCost.label}" ويمثل ${maqsoumFormatPercent(
        topCost.percentOfCosts
      )} من إجمالي التكاليف.`
    );
  }

  if (results.ordersCount > 0) {
    notes.push(
      `تكلفة الطلب الواحد تقريبًا ${maqsoumFormatNumber(results.costPerOrder, 2)}.`
    );
  }

  if (results.capitalRecoveryPercent !== null) {
    if (results.capitalRecoveryPercent >= 100) {
      notes.push("تهانينا، لقد استرددت رأس مالك بالكامل من الأرباح المسجّلة حتى الآن.");
    } else {
      notes.push(
        `استرددت حتى الآن ${maqsoumFormatPercent(
          results.capitalRecoveryPercent
        )} من رأس مالك، والمتبقي تقريبًا ${maqsoumFormatNumber(
          results.capitalRemaining
        )}.`
      );
    }
  }

  notes.push("هذه أرقام تقديرية مبنية فقط على البيانات التي أدخلتها، وليست نصيحة مالية.");

  return notes;
}
