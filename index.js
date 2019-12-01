const contractSource = `
payable contract CouponDirectory =
    
record coupon = 
  { userAddress : address,
    userName : string,
    couponTitle : string,
    couponValue : string,
    couponUrl : string,
    noOfUses : int,
    validityPeriod : int,
    amount : int,
    noOfPurchases : int }
        
record state =
  { coupons      : map(int, coupon),
    totalCoupons : int }
        
entrypoint init() =
  { coupons = {},
    totalCoupons = 0 }
        
entrypoint getCoupon(index : int) : coupon =
   switch(Map.lookup(index, state.coupons))
     None    => abort("Sorry, there is no such coupon!")
     Some(x) => x
            
stateful entrypoint registerCoupon( usrName : string, cpnTitle : string, cpnValue : string, cpnUrl : string, noUses : int, vldPeriod : int, amt : int) =
  let coupon = { userAddress = Call.caller, userName = usrName, couponTitle = cpnTitle, couponValue = cpnValue, couponUrl = cpnUrl, noOfUses = noUses, validityPeriod = vldPeriod, amount = amt, noOfPurchases = 0}
  let index = getTotalCoupons() + 1
  put(state{ coupons[index] = coupon, totalCoupons = index })
        
entrypoint getTotalCoupons() : int =
  state.totalCoupons
        
payable stateful entrypoint buyCoupon(index : int) =
  let coupon = getCoupon(index)
  if(coupon.noOfPurchases < coupon.noOfUses)
    Chain.spend(coupon.userAddress, coupon.amount)
    let purchaseTimes = coupon.noOfPurchases + 1
    let updatedCouponDirectory = state.coupons{ [index].noOfPurchases = purchaseTimes }
    put(state{ coupons = updatedCouponDirectory })      
  else
    abort("Coupon no longer available!")
`;

const contractAddress = "ct_2T4562sqNRsQze6hbNuscg7vx31GNuPAn2cTsyRB4y2AF7n4eV";
var client = null;
var couponArray = [];
var couponsLength = 0;

function renderCoupons() {
  couponArray = couponArray.sort(function(a, b) {
    return a.uses - b.uses;
  });
  var template = $("#template").html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, { couponArray });
  $("#couponBody").html(rendered);
}

window.addEventListener("load", async () => {
  $("#loader").show();

  client = await Ae.Aepp();

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  const calledGet = await contract
    .call("getTotalCoupons", [], { callStatic: true })
    .catch(e => console.error(e));
  console.log("calledGet", calledGet);

  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log("decodedGet", decodedGet);

  renderCoupons();

  $("#loader").hide();
});

jQuery("#couponBody").on("click", ".getBtn", async function(event) {
  const dataIndex = event.target.id;
  const foundIndex = couponArray.findIndex(coupon => coupon.index == dataIndex);
  if (couponArray[foundIndex].uses < 1) {
    alert("Coupon no longer available!");
  } else {
    alert(couponArray[foundIndex].couponValue);
    couponArray[foundIndex].uses = couponArray[foundIndex].uses - 1;
    renderCoupons();
  }
});

$("#submitBtn").click(async function() {
  var name = $("#regName").val(),
    summary = $("#regTitle").val(),
    cpnCode = $("#regValue").val(),
    siteUrl = $("#regUrl").val();
  (noUses = $("#regUses").val()),
    (validFr = $("#regValid").val()),
    (amnt = $("#regAmount").val());

  couponArray.push({
    userName: name,
    couponValue: cpnCode,
    couponTitle: summary,
    amount: amnt,
    validity: validFr,
    uses: noUses,
    index: couponArray.length + 1
  });
  renderCoupons();
});
