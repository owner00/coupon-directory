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
      abort("Coupon no longer available!")`;

const contractAddress = "ct_2tmBSgrY5WNVaWFh2Fk3CG8RdUirhC8ezkkffNVUZd4ssgbg7o";
var client = null;
var couponArray = [];
var couponsLength = 0;

function renderCoupons() {
  // couponArray = couponArray.sort(function(a, b) {
  //   return a.uses - b.uses;
  // });
  var template = $("#template").html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, { couponArray });
  $("#couponBody").html(rendered);
}

async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}



window.addEventListener("load", async () => {
  $("#loader").show();

  client = await Ae.Aepp();
  
  couponLength = await callStatic('getTotalCoupons', []);


  for (let i = 1; i <= couponLength; i++) {
    const coupons = await callStatic('getCoupon', [i]);

    couponArray.push({
      userName: coupons.userName,
      couponValue: coupons.couponValue,
      couponTitle: coupons.couponTitle,
      amount: coupons.amount,
      validity: coupons.validityPeriod,
      uses: coupons.noOfUses,
      index: couponArray.length + 1
    });


  renderCoupons();

  $("#loader").hide();
}});

jQuery("#couponBody").on("click", ".getBtn", async function(event) {
  const dataIndex = event.target.id;
  const foundIndex = couponArray.findIndex(coupon => coupon.index == dataIndex);
  
  buy = await callStatic('getCoupon', [dataIndex])
  if (couponArray[foundIndex].uses < 1) {
    console.log("Coupon no longer available!");
  } else {
    console.log(couponArray[foundIndex].couponValue);
    couponArray[foundIndex].uses = couponArray[foundIndex].uses - 1;
    await contractCall('buyCoupon', [dataIndex], buy.amount )
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
