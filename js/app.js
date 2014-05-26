(function(){

    // 初始化SDK (把你剛剛抄下來的Application ID和 JavaScript Key放上去)
    Parse.initialize("EzLtn8KuqKEXbg5CpoJEnMWDixm5frqpKu7436ky", "xJQQcxUZaRk1EpiGKbupKAPBnxWo1gbUsBDRlikR");

 	//編譯template engine函數();
 	var e={};
	["loginView","evaluationView","updateSuccessView"].forEach(function(t){
		templateCode=document.getElementById(t).text;
		e[t]=doT.template(templateCode)
	});
	var t={
		loginRequiredView:function(e){
			return function(){
				var currentUser = Parse.User.current();
				if(currentUser){
					e()
				} else {
					// 重新導向到登入頁面，登入後會回到商品
					window.location.hash="login/"+window.location.hash
				}
			}
		}
	};

  	// 可選-編寫共用函數();
  	var handler = {
    	navbar函數: function(){
    		var currentUser = Parse.User.current();
			if(currentUser){	// 登入時，顯示哪些buttons(logout,evaluation)
				document.getElementById("loginButton").style.display="none";
				document.getElementById("logoutButton").style.display="block";
				document.getElementById("evaluationButton").style.display="block"
			} else {	// 未登入時，顯示哪些buttons(login,evaluation)
				document.getElementById("loginButton").style.display="block";
				document.getElementById("logoutButton").style.display="none";
				document.getElementById("evaluationButton").style.display="none"
			}

			// 登出時
			document.getElementById("logoutButton").addEventListener("click",function(){
				Parse.User.logOut();
				handler.navbar();
				// 重新導向到登入頁面
				window.location.hash="login/"
			})
    	}	// end navbar function

    	,loginView:function(t){
			var r = function(currentUser){
				var t = document.getElementById(currentUser).value;
				return TAHelp.getMemberlistOf(t) === false ? false : true
			};
			var i = function(currentUser,t,handler){
				if(!t()){
					document.getElementById(currentUser).innerHTML = handler;
					document.getElementById(currentUser).style.display="block"
				} else {
					document.getElementById(currentUser).style.display="none"
				}
			};
			var s = function(){
				handler.navbar();
				// 重新導向到登入頁面，登入後會回到商品
				window.location.hash = t ? t : ""
			};

			// 綁定兩次密碼一致與否檢查事件
			var check_pw_consistent = function(){
				var password=document.getElementById("form-signup-password");
				var password1=document.getElementById("form-signup-password1");
				var password_consistent=password.value===password1.value?true:false;
				i("form-signup-message",function(){
					return password_consistent
				},"Passwords don't match.");
				return password_consistent
			};

			document.getElementById("content").innerHTML = e.loginView();
			// 綁定登入表單的學號檢查事件
			document.getElementById("form-signin-student-id").addEventListener("keyup",function(){
				i("form-signin-message",function(){
					return r("form-signin-student-id")
				},"The student is not one of the class students.")
			});

			document.getElementById("form-signin").addEventListener("submit",function(){
				if(!r("form-signin-student-id")){
					alert("The student is not one of the class students.");
					return false
				}

				// 綁定登入表單的登入檢查事件 Parse.User.logIn(id,pw)
				Parse.User.logIn(document.getElementById("form-signin-student-id").value, document.getElementById("form-signin-password").value,{
					success:function(currentUser){
						s()
					},error:function(currentUser,t){
						i("form-signin-message",function(){
							return false
						},"Invaild username or password.")
					}
				})
			},false);


			/* 註冊 */
			// 註冊的id
			document.getElementById("form-signup-student-id").addEventListener("keyup",function(){
				i("form-signup-message",function(){
					return r("form-signup-student-id")
				},"The student is not one of the class students.")
			});

			// 註冊的password
			document.getElementById("form-signup-password1").addEventListener("keyup",check_pw_consistent);
			// 綁定註冊按鈕觸發事件();
			document.getElementById("form-signup").addEventListener("submit",function(){
				if(!r("form-signup-student-id")){
					alert("The student is not one of the class students.");
					return false
				}
				var e = check_pw_consistent();
				if(!e){
					return false
				}

				var user = new Parse.User;
				user.set("username",document.getElementById("form-signup-student-id").value);
				user.set("password",document.getElementById("form-signup-password").value);
				user.set("email",document.getElementById("form-signup-email").value);
				user.signUp(null,{
					success:function(currentUser){
						s()
					},error:function(currentUser,t){
						i("form-signup-message",function(){
							return false
						},user.message)
					}
				})
			},false)

		} // end login view function

		,evaluationView:t.loginRequiredView(function(){	// 評分view
			var Evaluation = Parse.Object.extend("Evaluation");	// 取得parse的Evaluation Class // t
			var currentUser = Parse.User.current();	// 檢查登入	// n

			var evaluationACL = new Parse.ACL;	// ACL:Access Control List	// r
			evaluationACL.setPublicReadAccess(false);
			evaluationACL.setPublicWriteAccess(false);
			evaluationACL.setReadAccess(currentUser,true);
			evaluationACL.setWriteAccess(currentUser,true);

			// 設定查詢參數()
			var query = new Parse.Query(Evaluation);	// 創一個查Evaluation的Query物件	// i
			// 設定query條件(object的user欄位指向給定的User object)
			query.equalTo("user",currentUser);

			// 問看看Parse有沒有這個使用者之前提交過的peer review物件(
      		// 執行query
			query.first({success:function(query){
				window.EVAL = query;
				if(query === undefined){	// 如果evaluation不存在，從TAHelp生一個出來(加上scores: [‘0’, ‘0’, ‘0’, ‘0’]屬性存分數並把自己排除掉)
					var s = TAHelp.getMemberlistOf(currentUser.get("username")).filter(function(e){
						return e.StudentId !== currentUser.get("username") ? true : false
					}).map(function(e){
						currentUser.scores=["0","0","0","0"];
						return currentUser
					})
				} else {	// evaluation 已存在
					var s = query.toJSON().evaluations
				}

				// 綁定表單送出的事件()
				document.getElementById("content").innerHTML=e.evaluationView(s);
				document.getElementById("evaluationForm-submit").value = query === undefined ? "送出表單" : "修改表單";
				document.getElementById("evaluationForm").addEventListener("submit",function(){
					for(var o=0;o<s.length;o++){
						for(var u=0;u<s[o].scores.length;u++){
							var a=document.getElementById("stu"+s[o].StudentId+"-q"+u);
							var f=a.options[a.selectedIndex].value;
							s[o].scores[u]=f
						}
					}

					if(query===undefined){
						query = new query;
						query.set("user",currentUser);
						query.setACL(evaluationACL)
					}

					console.log(s);
					query.set("evaluations",s);
					query.save(null,{	// 將更新或新增的evaluation object 存到 Parse Server上
						success:function(){
							document.getElementById("content").innerHTML = e.updateSuccessView()
						},error:function(){
						}
					})
				},false)}
				,error:function(e,Evaluation){
				}
			})
		})
  	};

  	var App = Parse.Router.extend({
		routes:{
			// 路徑匹配
			"":"indexView",
			"peer-evaluation/":"evaluationView",
			"login/*redirect":"loginView"
		},
		// 呼叫handler裡的函數
		indexView:handler.evaluationView,
		evaluationView:handler.evaluationView,
		loginView:handler.loginView
	});
			
	// 讓router活起來();		
	this.Router=new App;
	Parse.history.start();

	// 根據user登入與否，顯示navbar內容
	handler.navbar()

})()
