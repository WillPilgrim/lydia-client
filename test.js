tomato = { id: "1", ratingId: "1", name: "Tomato", price: "3.50" };
templates = [
  tomato,
  { id: "2", ratingId: "3", name: "Carrot", price: "0.12" },
  { id: "3", ratingId: "2", name: "Celery", price: "1.80" }
];
ratings = [
  { id: "1", name: "Good" },
  { id: "2", name: "Average" },
  { id: "3", name: "Awful" }
];

//mf = (template) => ({ratingName:ratings.find(rating => rating.id == template.id).name,...template});
mf = ({ratingId,...remaining}) => ({ratingName:ratings.find(rating => rating.id == ratingId).name,...remaining});
//console.log(templates.map(({ratingId,...remaining}) => ({ratingName:ratings.find(rating => rating.id == ratingId).name,...remaining})));
console.log(templates.map(({ratingId:rid,...rest}) => ({rating:ratings.find(x => x.id == rid).name,...rest})));