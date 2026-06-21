// Each level's denominator = order.length (2, 3, 4, 6 or 8 slices).
// Curriculum eases from halves up to eighths with growing topping variety.
const levels = [
  // halves (1/2)
  { order: ["cheese", "olive"] },
  { order: ["pepperoni", "cheese"] },
  // quarters (x/4)
  { order: ["cheese", "cheese", "cheese", "cheese"] },
  { order: ["cheese", "cheese", "olive", "olive"] },
  { order: ["cheese", "olive", "olive", "cheese"] },
  { order: ["cheese", "cheese", "cheese", "olive"] },
  // thirds (x/3)
  { order: ["cheese", "cheese", "olive"] },
  { order: ["mushroom", "cheese", "olive"] },
  // quarters with more toppings
  { order: ["pepperoni", "pepperoni", "cheese", "cheese"] },
  { order: ["olive", "olive", "pepperoni", "pepperoni"] },
  { order: ["cheese", "olive", "pepperoni", "cheese"] },
  { order: ["mushroom", "mushroom", "cheese", "pepper"] },
  // sixths (x/6)
  { order: ["cheese", "cheese", "olive", "olive", "pepperoni", "pepperoni"] },
  { order: ["pepper", "pepper", "pepper", "cheese", "cheese", "mushroom"] },
  // eighths (x/8)
  { order: ["cheese", "cheese", "cheese", "cheese", "olive", "olive", "pepperoni", "pepperoni"] },
  { order: ["pepperoni", "cheese", "olive", "mushroom", "pepper", "cheese", "olive", "pepperoni"] }
];
