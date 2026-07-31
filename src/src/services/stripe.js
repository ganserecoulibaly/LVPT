/**
 * =====================================================
 * STRIPE
 * =====================================================
 *
 * Ce fichier est volontairement prêt pour la future
 * intégration Stripe.
 *
 * Tant que le compte Stripe n'est pas créé,
 * toutes les fonctions renvoient simplement
 * des informations dans la console.
 *
 * Lorsque Stripe sera disponible, il suffira
 * de remplacer la fonction createCheckoutSession().
 *
 */

export const STRIPE_PRODUCTS = {

    occasionnel: {

        monthly: "",

        yearly: "",

    },

    grand: {

        monthly: "",

        yearly: "",

    },

}

/**
 * Retourne le Price ID Stripe correspondant.
 */
export function getPriceId(plan, billing) {

    const product = STRIPE_PRODUCTS[plan]

    if (!product) {
        return null
    }

    return billing === "monthly"
        ? product.monthly
        : product.yearly

}

/**
 * Création d'une future session Stripe.
 *
 * Pour l'instant :
 * → console.log()
 *
 * Plus tard :
 * → Supabase Edge Function
 * → Stripe Checkout
 */
export async function createCheckoutSession({

    plan,

    billing,

}) {

    const priceId = getPriceId(plan, billing)

    console.group("Stripe Checkout")

    console.log("Plan :", plan)

    console.log("Billing :", billing)

    console.log("Price ID :", priceId)

    console.groupEnd()

    return {

        success: true,

    }

}

/**
 * Lance le Checkout.
 */
export async function startCheckout({

    plan,

    billing,

}) {

    try {

        const result = await createCheckoutSession({

            plan,

            billing,

        })

        return result

    } catch (error) {

        console.error(error)

        return {

            success: false,

            error,

        }

    }

}

/**
 * -----------------------------------------------------
 * FUTURE VERSION
 * -----------------------------------------------------
 *
 * export async function createCheckoutSession(...)
 *
 * const { data } = await supabase.functions.invoke(...)
 *
 * window.location.href = data.url
 *
 * -----------------------------------------------------
 */
